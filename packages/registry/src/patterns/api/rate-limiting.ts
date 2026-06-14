import type { Pattern } from "../../schema.js";

export const rateLimiting: Pattern = {
  name: "Rate Limiting",
  slug: "rate-limiting",
  description:
    "API rate limiting with sliding window algorithm. Works with serverless and edge runtimes using Upstash Redis.",
  category: "api",
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/rate-limit.ts",
        content: `import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a rate limiter that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  return { success, limit, remaining, reset };
}

// Pre-configured limiters for common use cases
export const limiters = {
  // Strict: 5 requests per minute (for sensitive endpoints)
  strict: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "ratelimit:strict",
  }),

  // Standard: 60 requests per minute
  standard: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "ratelimit:standard",
  }),

  // Relaxed: 100 requests per minute
  relaxed: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    prefix: "ratelimit:relaxed",
  }),
};
`,
      },
      {
        path: "lib/middleware/rate-limit.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, limiters } from "@/lib/rate-limit";

export type RateLimitTier = "strict" | "standard" | "relaxed";

interface RateLimitOptions {
  tier?: RateLimitTier;
  identifier?: (req: NextRequest) => string;
}

// Get client identifier (IP address or user ID)
// IMPORTANT: x-user-id header should only be trusted after authentication middleware
// has verified the user. Ensure this runs AFTER your auth middleware in the chain.
function getIdentifier(req: NextRequest): string {
  // Try to get user ID from auth header/cookie first (set by auth middleware)
  const userId = req.headers.get("x-user-id");
  if (userId) return \`user:\${userId}\`;

  // Fall back to IP address
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ??
    "anonymous";

  return \`ip:\${ip}\`;
}

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: RateLimitOptions = {}
) {
  const { tier = "standard", identifier = getIdentifier } = options;

  return async (req: NextRequest): Promise<NextResponse> => {
    const id = identifier(req);
    const limiter = limiters[tier];
    const { success, limit, remaining, reset } = await limiter.limit(id);

    // Add rate limit headers
    const headers = new Headers();
    headers.set("X-RateLimit-Limit", limit.toString());
    headers.set("X-RateLimit-Remaining", remaining.toString());
    headers.set("X-RateLimit-Reset", reset.toString());

    if (!success) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Please try again later",
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        { status: 429, headers }
      );
    }

    const response = await handler(req);

    // Add rate limit headers to successful response
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
`,
      },
      {
        path: "app/api/example/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/middleware/rate-limit";

// Rate-limited API endpoint
async function handler(req: NextRequest) {
  return NextResponse.json({ message: "Hello, world!" });
}

// Apply standard rate limiting (60 req/min)
export const GET = withRateLimit(handler);

// Apply strict rate limiting for mutations (5 req/min)
export const POST = withRateLimit(handler, { tier: "strict" });
`,
      },
      {
        path: ".env.example",
        content: `# Upstash Redis (get from https://console.upstash.com)
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
    nextjs: [{ name: "@upstash/ratelimit" }, { name: "@upstash/redis" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
