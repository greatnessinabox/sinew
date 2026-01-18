import type { Pattern } from "../../schema.js";

export const inMemoryCache: Pattern = {
  name: "In-Memory Cache",
  slug: "in-memory-cache",
  description:
    "Simple LRU in-memory caching for serverless. No external dependencies, perfect for small datasets.",
  category: "caching",
  tier: "free",
  complexity: "beginner",
  tags: ["caching", "lru", "serverless", "no-dependencies"],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/lru-cache.ts",
        content: `/**
 * Simple LRU (Least Recently Used) cache implementation.
 * No external dependencies, works in any JavaScript environment.
 */

interface CacheEntry<T> {
  value: T;
  expiry: number | null;
}

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  /**
   * Create a new LRU cache.
   * @param maxSize Maximum number of entries (default: 100)
   * @param defaultTTL Default TTL in milliseconds (default: 5 minutes)
   */
  constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get a value from the cache.
   * Returns undefined if not found or expired.
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (entry.expiry !== null && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set a value in the cache.
   * @param key Cache key
   * @param value Value to cache
   * @param ttl TTL in milliseconds (optional, uses default if not provided)
   */
  set(key: string, value: T, ttl?: number): void {
    // Delete if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    const expiry = ttl === undefined
      ? Date.now() + this.defaultTTL
      : ttl === 0
        ? null // 0 means no expiry
        : Date.now() + ttl;

    this.cache.set(key, { value, expiry });
  }

  /**
   * Check if a key exists and is not expired.
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expiry !== null && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete a key from the cache.
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern (simple prefix matching).
   */
  deleteByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current number of entries.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics.
   */
  stats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Cleanup expired entries.
   * Call this periodically in long-running processes.
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry !== null && now > entry.expiry) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Default cache instance
export const cache = new LRUCache<unknown>(100, 5 * 60 * 1000);
`,
      },
      {
        path: "lib/cache-utils.ts",
        content: `import { LRUCache } from "./lru-cache";

// Global cache instances for different purposes
const dataCache = new LRUCache<unknown>(500, 5 * 60 * 1000); // 5 min TTL
const shortCache = new LRUCache<unknown>(100, 30 * 1000); // 30 sec TTL

/**
 * Cache a function result with automatic key generation.
 *
 * @example
 * const getUser = cached(
 *   async (id: string) => db.user.findUnique({ where: { id } }),
 *   (id) => \`user:\${id}\`,
 *   { ttl: 60000 }
 * );
 */
export function cached<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyFn: (...args: TArgs) => string,
  options: { ttl?: number; cache?: LRUCache<unknown> } = {}
): (...args: TArgs) => Promise<TResult> {
  const { ttl, cache = dataCache } = options;

  return async (...args: TArgs): Promise<TResult> => {
    const key = keyFn(...args);

    // Check cache
    const cachedValue = cache.get(key);
    if (cachedValue !== undefined) {
      return cachedValue as TResult;
    }

    // Execute and cache
    const result = await fn(...args);
    cache.set(key, result, ttl);

    return result;
  };
}

/**
 * Memoize a synchronous function.
 *
 * @example
 * const expensiveCalculation = memoize(
 *   (a: number, b: number) => { ... },
 *   (a, b) => \`calc:\${a}:\${b}\`
 * );
 */
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  keyFn: (...args: TArgs) => string,
  options: { ttl?: number; cache?: LRUCache<unknown> } = {}
): (...args: TArgs) => TResult {
  const { ttl, cache = dataCache } = options;

  return (...args: TArgs): TResult => {
    const key = keyFn(...args);

    const cachedValue = cache.get(key);
    if (cachedValue !== undefined) {
      return cachedValue as TResult;
    }

    const result = fn(...args);
    cache.set(key, result, ttl);

    return result;
  };
}

/**
 * Get or set pattern - fetch from cache or execute function.
 *
 * @example
 * const user = await getOrSet(
 *   \`user:\${id}\`,
 *   () => db.user.findUnique({ where: { id } })
 * );
 */
export async function getOrSet<T>(
  key: string,
  fn: () => Promise<T>,
  options: { ttl?: number; cache?: LRUCache<unknown> } = {}
): Promise<T> {
  const { ttl, cache = dataCache } = options;

  const cachedValue = cache.get(key);
  if (cachedValue !== undefined) {
    return cachedValue as T;
  }

  const result = await fn();
  cache.set(key, result, ttl);

  return result;
}

/**
 * Invalidate cache entries by key or prefix.
 */
export const invalidate = {
  key: (key: string) => dataCache.delete(key),
  prefix: (prefix: string) => dataCache.deleteByPrefix(prefix),
  all: () => dataCache.clear(),
};

/**
 * Cache key generators for common patterns.
 */
export const cacheKeys = {
  user: (id: string) => \`user:\${id}\`,
  userByEmail: (email: string) => \`user:email:\${email}\`,
  post: (id: string) => \`post:\${id}\`,
  postsByUser: (userId: string) => \`posts:user:\${userId}\`,
  list: (entity: string, page: number) => \`\${entity}:list:\${page}\`,
  query: (entity: string, query: Record<string, unknown>) =>
    \`\${entity}:query:\${JSON.stringify(query)}\`,
};

// Export cache instances for direct access if needed
export { dataCache, shortCache };
`,
      },
      {
        path: "app/api/users/[id]/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { getOrSet, invalidate, cacheKeys } from "@/lib/cache-utils";

// Simulated user type
interface User {
  id: string;
  name: string;
  email: string;
}

// Simulated database function
async function fetchUserFromDB(id: string): Promise<User | null> {
  // Replace with your actual database query
  // return db.user.findUnique({ where: { id } });

  // Simulated delay and data
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    id,
    name: "John Doe",
    email: "john@example.com",
  };
}

// GET /api/users/[id] - Cached user fetch
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getOrSet(
    cacheKeys.user(id),
    () => fetchUserFromDB(id),
    { ttl: 5 * 60 * 1000 } // 5 minutes
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

  // Invalidate user cache
  invalidate.key(cacheKeys.user(id));

  // If user email changed, also invalidate email lookup
  if (body.email) {
    invalidate.prefix("user:email:");
  }

  return NextResponse.json({
    data: { id, ...body },
    message: "User updated, cache invalidated",
  });
}

// DELETE /api/users/[id] - Delete user and clear cache
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Delete from database
  // await db.user.delete({ where: { id } });

  // Invalidate all user-related caches
  invalidate.key(cacheKeys.user(id));
  invalidate.prefix(\`posts:user:\${id}\`);

  return NextResponse.json({
    message: "User deleted, cache invalidated",
  });
}
`,
      },
      {
        path: "app/posts/page.tsx",
        content: `import { cached, cacheKeys } from "@/lib/cache-utils";

// Simulated post type
interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: Date;
}

// Cached posts fetcher
const getPosts = cached(
  async (page: number): Promise<Post[]> => {
    // Replace with your actual database query
    // return db.post.findMany({
    //   skip: (page - 1) * 10,
    //   take: 10,
    //   orderBy: { publishedAt: "desc" },
    // });

    // Simulated data
    console.log(\`Fetching posts for page \${page} from database...\`);
    return [
      {
        id: "1",
        title: "Getting Started with In-Memory Caching",
        slug: "in-memory-caching",
        excerpt: "Learn how to implement efficient caching without dependencies...",
        publishedAt: new Date("2025-01-15"),
      },
      {
        id: "2",
        title: "LRU Cache Explained",
        slug: "lru-cache-explained",
        excerpt: "Understanding the Least Recently Used eviction strategy...",
        publishedAt: new Date("2025-01-10"),
      },
    ];
  },
  (page) => cacheKeys.list("posts", page),
  { ttl: 2 * 60 * 1000 } // 2 minutes
);

export default async function PostsPage() {
  const page = 1; // In real app, get from searchParams
  const posts = await getPosts(page);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Blog Posts</h1>

      <div className="grid gap-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">
              <a href={\`/posts/\${post.slug}\`} className="hover:underline">
                {post.title}
              </a>
            </h2>
            <p className="text-gray-600 mb-4">{post.excerpt}</p>
            <time className="text-sm text-gray-500">
              {post.publishedAt.toLocaleDateString()}
            </time>
          </article>
        ))}
      </div>
    </div>
  );
}
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
