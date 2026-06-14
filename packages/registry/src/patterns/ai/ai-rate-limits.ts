import type { Pattern } from "../../schema.js";

export const aiRateLimits: Pattern = {
  name: "AI Rate Limits",
  slug: "ai-rate-limits",
  description:
    "Token-aware rate limiting for AI endpoints. Includes per-user quotas, cost tracking, and usage analytics using Upstash.",
  category: "ai",
  frameworks: ["nextjs"],
  tier: "freemium",
  complexity: "intermediate",
  tags: ["ai", "rate-limiting", "tokens", "cost", "quotas", "upstash"],
  files: {
    nextjs: [
      {
        path: "lib/ai/rate-limits.ts",
        content: `import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Token-based rate limiting
// Limits based on estimated token usage rather than just request count

export interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// Configurable limits per tier
export const tierLimits = {
  free: {
    tokensPerDay: 10_000,
    requestsPerMinute: 10,
    maxTokensPerRequest: 4_000,
  },
  pro: {
    tokensPerDay: 100_000,
    requestsPerMinute: 60,
    maxTokensPerRequest: 8_000,
  },
  enterprise: {
    tokensPerDay: 1_000_000,
    requestsPerMinute: 200,
    maxTokensPerRequest: 32_000,
  },
} as const;

export type Tier = keyof typeof tierLimits;

const DAY_SECONDS = 86400;
const tokenKey = (userId: string) => \`ai:tokens:\${userId}\`;

// One request limiter per tier, created once at module load. Creating a new
// Ratelimit per call would forfeit the SDK's ephemeral in-memory cache and
// the analytics enabled here.
const requestLimiters = new Map<Tier, Ratelimit>();

function getRequestLimiter(tier: Tier): Ratelimit {
  let limiter = requestLimiters.get(tier);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        tierLimits[tier].requestsPerMinute,
        "1 m"
      ),
      prefix: \`ai:requests:\${tier}\`,
      analytics: true,
    });
    requestLimiters.set(tier, limiter);
  }
  return limiter;
}

// Check request rate limit
export async function checkRequestLimit(
  userId: string,
  tier: Tier = "free"
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const result = await getRequestLimiter(tier).limit(userId);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

// Token bucket for daily limits.
// Reserves the estimated tokens atomically so concurrent requests can't both
// read usage under the limit and both proceed (TOCTOU). Reconcile the actual
// usage afterwards with reconcileTokenUsage.
export async function checkTokenLimit(
  userId: string,
  requestedTokens: number,
  tier: Tier = "free"
): Promise<{
  success: boolean;
  remainingTokens: number;
  resetAt: number;
}> {
  const key = tokenKey(userId);
  const dailyLimit = tierLimits[tier].tokensPerDay;

  // Consume first, then check the result. incrby returns the post-increment
  // value, so the check + consume is a single atomic operation per key.
  const newUsage = await redis.incrby(key, requestedTokens);

  // Ensure the key always carries a TTL, but never extend an existing window.
  await redis.expire(key, DAY_SECONDS, "NX");

  const ttl = await redis.ttl(key);
  const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : DAY_SECONDS * 1000);

  if (newUsage > dailyLimit) {
    // Over the limit — refund the reservation we just made.
    await redis.incrby(key, -requestedTokens);
    return {
      success: false,
      remainingTokens: Math.max(0, dailyLimit - (newUsage - requestedTokens)),
      resetAt,
    };
  }

  return {
    success: true,
    remainingTokens: dailyLimit - newUsage,
    resetAt,
  };
}

// Reconcile a reservation once the real token count is known. Pass the same
// estimate given to checkTokenLimit plus the actual usage; only the delta is
// applied, so a request is never double-counted.
export async function reconcileTokenUsage(
  userId: string,
  estimatedTokens: number,
  actualTokens: number
): Promise<void> {
  const delta = actualTokens - estimatedTokens;
  if (delta === 0) return;
  const key = tokenKey(userId);
  await redis.incrby(key, delta);
  await redis.expire(key, DAY_SECONDS, "NX");
}

// Get user's current usage stats
export async function getUsageStats(userId: string): Promise<{
  tokensUsedToday: number;
  requestsThisMinute: number;
}> {
  const tokensUsed = (await redis.get<number>(tokenKey(userId))) ?? 0;

  return {
    tokensUsedToday: tokensUsed,
    requestsThisMinute: 0, // Would need separate tracking
  };
}
`,
      },
      {
        path: "lib/ai/usage-tracking.ts",
        content: `import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export interface UsageRecord {
  userId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: number;
}

// Model pricing (per 1K tokens, in USD)
export const modelPricing = {
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "claude-sonnet-4-20250514": { input: 0.003, output: 0.015 },
  "claude-3-5-haiku-20241022": { input: 0.0008, output: 0.004 },
  "text-embedding-3-small": { input: 0.00002, output: 0 },
} as const;

export type ModelName = keyof typeof modelPricing;

// Calculate cost for a request
export function calculateCost(
  model: ModelName,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = modelPricing[model];
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;

  return inputCost + outputCost;
}

// Record usage for analytics
export async function recordUsage(record: UsageRecord): Promise<void> {
  const { userId, model, inputTokens, outputTokens, cost, timestamp } = record;

  // Store in sorted set for time-series queries. Keep the timestamp inside the
  // member too so getUsageHistory can report when usage happened.
  const key = \`usage:\${userId}\`;
  await redis.zadd(key, {
    score: timestamp,
    member: JSON.stringify({ model, inputTokens, outputTokens, cost, timestamp }),
  });

  // Aggregate daily stats
  const day = new Date(timestamp).toISOString().split("T")[0];
  const dailyKey = \`usage:daily:\${userId}:\${day}\`;

  await redis.hincrby(dailyKey, "totalTokens", inputTokens + outputTokens);
  await redis.hincrbyfloat(dailyKey, "totalCost", cost);
  await redis.hincrby(dailyKey, "requests", 1);
  await redis.expire(dailyKey, 60 * 60 * 24 * 30); // Keep 30 days
}

// Get usage for a time period
export async function getUsageHistory(
  userId: string,
  startTime: number,
  endTime: number
): Promise<UsageRecord[]> {
  const key = \`usage:\${userId}\`;
  const results = await redis.zrange(key, startTime, endTime, {
    byScore: true,
  });

  // Members were stored with JSON.stringify. Depending on client config they
  // come back as strings or already-parsed objects, so handle both.
  return results.map((r) => {
    const parsed = typeof r === "string" ? JSON.parse(r) : r;
    return { userId, ...parsed } as UsageRecord;
  });
}

// Get daily summary
export async function getDailySummary(
  userId: string,
  date: string
): Promise<{
  totalTokens: number;
  totalCost: number;
  requests: number;
} | null> {
  const key = \`usage:daily:\${userId}:\${date}\`;
  const data = await redis.hgetall(key);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return {
    totalTokens: Number(data.totalTokens) || 0,
    totalCost: Number(data.totalCost) || 0,
    requests: Number(data.requests) || 0,
  };
}

// Get monthly cost estimate
export async function getMonthlyCost(userId: string): Promise<number> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  let totalCost = 0;
  for (let day = 1; day <= now.getDate(); day++) {
    const date = \`\${year}-\${month}-\${String(day).padStart(2, "0")}\`;
    const summary = await getDailySummary(userId, date);
    if (summary) {
      totalCost += summary.totalCost;
    }
  }

  return totalCost;
}
`,
      },
      {
        path: "lib/middleware/ai-rate-limit.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { checkRequestLimit, checkTokenLimit, type Tier } from "@/lib/ai/rate-limits";

// Estimate tokens from request (rough estimation)
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

interface AIRateLimitOptions {
  getUserId: (req: NextRequest) => string | null;
  getUserTier?: (req: NextRequest) => Tier;
  estimateTokens?: (req: NextRequest) => number;
}

export function withAIRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  options: AIRateLimitOptions
) {
  return async (req: NextRequest): Promise<Response> => {
    const userId = options.getUserId(req);

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const tier = options.getUserTier?.(req) ?? "free";

    // Check request rate limit
    const requestCheck = await checkRequestLimit(userId, tier);
    if (!requestCheck.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((requestCheck.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": requestCheck.remaining.toString(),
            "X-RateLimit-Reset": requestCheck.reset.toString(),
            "Retry-After": Math.ceil(
              (requestCheck.reset - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // Estimate and reserve tokens. checkTokenLimit consumes this estimate up
    // front; once the real usage is known, call reconcileTokenUsage(userId,
    // estimatedTokens, actualTokens) to correct the reservation.
    // This is a rough char/4 heuristic — provide options.estimateTokens for a
    // model-aware estimate. req.clone() avoids consuming the handler's body.
    let estimatedTokens = 1000; // Default estimate
    try {
      if (options.estimateTokens) {
        estimatedTokens = options.estimateTokens(req);
      } else {
        const body = await req.clone().json();
        const text = JSON.stringify(body);
        estimatedTokens = estimateTokens(text) + 500; // Add buffer for response
      }
    } catch {
      // Use default if body parsing fails
    }

    const tokenCheck = await checkTokenLimit(userId, estimatedTokens, tier);
    if (!tokenCheck.success) {
      return NextResponse.json(
        {
          error: "Token limit exceeded",
          message: "Daily token limit reached. Upgrade for more tokens.",
          remainingTokens: tokenCheck.remainingTokens,
          resetAt: new Date(tokenCheck.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-Token-Remaining": tokenCheck.remainingTokens.toString(),
            "X-Token-Reset": tokenCheck.resetAt.toString(),
          },
        }
      );
    }

    // Add rate limit info to response headers
    const response = await handler(req);

    const headers = new Headers(response.headers);
    headers.set("X-RateLimit-Remaining", requestCheck.remaining.toString());
    headers.set("X-Token-Remaining", tokenCheck.remainingTokens.toString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
`,
      },
      {
        path: "app/api/ai/usage/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { getUsageStats } from "@/lib/ai/rate-limits";
import { getDailySummary, getMonthlyCost } from "@/lib/ai/usage-tracking";

export async function GET(req: NextRequest) {
  // Get user ID from auth (replace with your auth logic)
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const stats = await getUsageStats(userId);
    const today = new Date().toISOString().split("T")[0];
    const dailySummary = await getDailySummary(userId, today);
    const monthlyCost = await getMonthlyCost(userId);

    return NextResponse.json({
      today: {
        tokensUsed: stats.tokensUsedToday,
        requests: dailySummary?.requests ?? 0,
        cost: dailySummary?.totalCost ?? 0,
      },
      month: {
        totalCost: monthlyCost,
      },
    });
  } catch (error) {
    console.error("Usage stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage stats" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: ".env.example",
        content: `# Upstash Redis (https://console.upstash.com)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [
      { name: "@upstash/ratelimit", version: "^2.0.0" },
      { name: "@upstash/redis", version: "^1.35.0" },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
