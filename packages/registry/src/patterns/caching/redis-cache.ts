import type { Pattern } from "../../schema.js";

export const redisCache: Pattern = {
  name: "Redis Cache",
  slug: "redis-cache",
  description:
    "Redis caching with Upstash. Includes cache utilities, automatic serialization, and cache invalidation patterns.",
  category: "caching",
  tier: "freemium",
  complexity: "intermediate",
  tags: ["caching", "redis", "upstash", "serverless", "performance"],
  alternatives: [
    {
      name: "Vercel KV",
      description: "Durable Redis database built on Upstash, integrated with Vercel",
      url: "https://vercel.com/storage/kv",
      pricingTier: "freemium",
      pricingNote: "Free tier with 3,000 requests/day",
      advantages: [
        "Zero config on Vercel",
        "Same Upstash Redis under the hood",
        "Integrated billing",
        "Edge-compatible",
      ],
      recommended: true,
    },
    {
      name: "Momento",
      description: "Serverless cache with no infrastructure to manage",
      url: "https://gomomento.com",
      pricingTier: "freemium",
      pricingNote: "Free tier with 5GB transfer/mo",
      advantages: [
        "True serverless (no clusters to manage)",
        "Sub-millisecond latency",
        "Simple SDK",
        "Pay-per-request pricing",
      ],
    },
    {
      name: "Cloudflare Workers KV",
      description: "Global, low-latency key-value store at the edge",
      url: "https://developers.cloudflare.com/kv",
      pricingTier: "freemium",
      pricingNote: "Free tier with 100k reads/day",
      advantages: [
        "Global edge distribution",
        "Great for static/semi-static data",
        "Integrated with Workers",
        "Very generous free tier",
      ],
    },
  ],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/cache.ts",
        content: `import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
}

const DEFAULT_TTL = 60 * 60; // 1 hour

// Get cached value or execute function and cache result
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL, tags = [] } = options;

  // Try to get from cache
  const cached = await redis.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  await redis.setex(key, ttl, result);

  // Store tags for invalidation
  if (tags.length > 0) {
    const pipeline = redis.pipeline();
    for (const tag of tags) {
      pipeline.sadd(\`tag:\${tag}\`, key);
    }
    await pipeline.exec();
  }

  return result;
}

// Invalidate cache by key
export async function invalidate(key: string): Promise<void> {
  await redis.del(key);
}

// Invalidate all keys with a tag
export async function invalidateTag(tag: string): Promise<void> {
  const keys = await redis.smembers(\`tag:\${tag}\`);
  if (keys.length > 0) {
    await redis.del(...keys, \`tag:\${tag}\`);
  }
}

// Cache with stale-while-revalidate pattern
export async function cachedSWR<T>(
  key: string,
  fn: () => Promise<T>,
  options: { ttl?: number; swr?: number } = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL, swr = ttl * 2 } = options;

  const data = await redis.get<{ value: T; timestamp: number }>(key);

  if (data) {
    const age = Date.now() - data.timestamp;

    // Fresh: return cached value
    if (age < ttl * 1000) {
      return data.value;
    }

    // Stale but within SWR window: return cached, revalidate in background
    if (age < swr * 1000) {
      // Revalidate in background (don't await)
      fn().then(async (result) => {
        await redis.setex(key, swr, { value: result, timestamp: Date.now() });
      });
      return data.value;
    }
  }

  // Cache miss or expired: fetch and cache
  const result = await fn();
  await redis.setex(key, swr, { value: result, timestamp: Date.now() });
  return result;
}

// Memoize function results
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyFn: (...args: TArgs) => string,
  ttl: number = DEFAULT_TTL
) {
  return async (...args: TArgs): Promise<TResult> => {
    const key = keyFn(...args);
    return cached(key, () => fn(...args), { ttl });
  };
}
`,
      },
      {
        path: "lib/cache-keys.ts",
        content: `// Centralized cache key management
export const cacheKeys = {
  // User-related
  user: (id: string) => \`user:\${id}\`,
  userByEmail: (email: string) => \`user:email:\${email}\`,
  userList: (page: number) => \`users:page:\${page}\`,

  // Post-related
  post: (id: string) => \`post:\${id}\`,
  postList: (page: number) => \`posts:page:\${page}\`,
  postsByUser: (userId: string) => \`posts:user:\${userId}\`,

  // Session/auth
  session: (id: string) => \`session:\${id}\`,

  // Feature flags
  featureFlags: () => "feature-flags",

  // Rate limiting
  rateLimit: (identifier: string) => \`ratelimit:\${identifier}\`,
} as const;

// Cache tags for bulk invalidation
export const cacheTags = {
  users: "users",
  posts: "posts",
  user: (id: string) => \`user:\${id}\`,
} as const;
`,
      },
      {
        path: "app/api/users/[id]/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { cached, invalidate, invalidateTag } from "@/lib/cache";
import { cacheKeys, cacheTags } from "@/lib/cache-keys";

// GET /api/users/[id] - Cached user fetch
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await cached(
    cacheKeys.user(id),
    async () => {
      // Your database query here
      // return db.user.findUnique({ where: { id } });
      return { id, name: "John Doe", email: "john@example.com" };
    },
    { ttl: 300, tags: [cacheTags.users, cacheTags.user(id)] }
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ data: user });
}

// PUT /api/users/[id] - Update user and invalidate cache
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Update in database
  // const user = await db.user.update({ where: { id }, data: body });

  // Invalidate specific cache
  await invalidate(cacheKeys.user(id));

  // Or invalidate all user-related caches
  // await invalidateTag(cacheTags.user(id));

  return NextResponse.json({ data: { id, ...body } });
}
`,
      },
      {
        path: ".env.example",
        content: `# Upstash Redis
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
    nextjs: [{ name: "@upstash/redis" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
