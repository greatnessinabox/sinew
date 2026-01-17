import type { Pattern } from "../../schema.js";

export const nextjsCache: Pattern = {
  name: "Next.js Cache",
  slug: "nextjs-cache",
  description:
    "Next.js built-in caching with unstable_cache, revalidatePath, and revalidateTag. Zero dependencies, works on Vercel.",
  category: "caching",
  tier: "free",
  complexity: "beginner",
  tags: ["caching", "nextjs", "serverless", "vercel"],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/cache.ts",
        content: `import { unstable_cache } from "next/cache";

type CacheOptions = {
  tags?: string[];
  revalidate?: number | false;
};

/**
 * Create a cached version of an async function using Next.js unstable_cache.
 * Results are cached across requests and can be invalidated using tags.
 *
 * @example
 * const getUser = cache(
 *   async (id: string) => db.user.findUnique({ where: { id } }),
 *   ["users"],
 *   { revalidate: 3600, tags: ["users"] }
 * );
 */
export function cache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyParts: string[],
  options: CacheOptions = {}
) {
  const { tags = [], revalidate = 3600 } = options;

  return unstable_cache(fn, keyParts, {
    tags,
    revalidate,
  });
}

/**
 * Create a cached function with automatic key generation from arguments.
 * Useful when you want cache keys to include function arguments.
 *
 * @example
 * const getPost = cacheWithKey(
 *   async (id: string) => db.post.findUnique({ where: { id } }),
 *   (id) => ["post", id],
 *   { tags: ["posts"] }
 * );
 */
export function cacheWithKey<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyFn: (...args: TArgs) => string[],
  options: CacheOptions = {}
) {
  const { tags = [], revalidate = 3600 } = options;

  return (...args: TArgs) => {
    const keyParts = keyFn(...args);
    const cachedFn = unstable_cache(fn, keyParts, {
      tags,
      revalidate,
    });
    return cachedFn(...args);
  };
}

/**
 * Cached data fetcher with built-in error handling.
 * Returns null on error instead of throwing.
 *
 * @example
 * const user = await safeCached(
 *   () => db.user.findUnique({ where: { id } }),
 *   ["user", id],
 *   { tags: ["users"] }
 * );
 */
export async function safeCached<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  options: CacheOptions = {}
): Promise<T | null> {
  const { tags = [], revalidate = 3600 } = options;

  const cachedFn = unstable_cache(
    async () => {
      try {
        return { data: await fn(), error: null };
      } catch (error) {
        console.error("Cache fetch error:", error);
        return { data: null, error: true };
      }
    },
    keyParts,
    { tags, revalidate }
  );

  const result = await cachedFn();
  return result.data;
}

// Common cache configurations
export const cacheConfig = {
  // Short-lived cache for frequently changing data
  short: { revalidate: 60 } as CacheOptions, // 1 minute

  // Medium-lived cache for semi-static data
  medium: { revalidate: 3600 } as CacheOptions, // 1 hour

  // Long-lived cache for rarely changing data
  long: { revalidate: 86400 } as CacheOptions, // 24 hours

  // Infinite cache (only invalidate manually)
  infinite: { revalidate: false } as CacheOptions,
} as const;
`,
      },
      {
        path: "lib/revalidate.ts",
        content: `import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Revalidate multiple paths at once.
 *
 * @example
 * await revalidatePaths(["/", "/posts", "/posts/[slug]"]);
 */
export function revalidatePaths(paths: string[], type?: "page" | "layout") {
  for (const path of paths) {
    revalidatePath(path, type);
  }
}

/**
 * Revalidate multiple tags at once.
 *
 * @example
 * await revalidateTags(["posts", "users"]);
 */
export function revalidateTags(tags: string[]) {
  for (const tag of tags) {
    revalidateTag(tag);
  }
}

/**
 * Revalidation patterns for common entities.
 * Centralizes cache invalidation logic.
 */
export const revalidation = {
  // User-related revalidation
  user: (id: string) => {
    revalidateTag("users");
    revalidateTag(\`user-\${id}\`);
    revalidatePath(\`/users/\${id}\`);
    revalidatePath("/users");
  },

  // Post-related revalidation
  post: (slug: string) => {
    revalidateTag("posts");
    revalidateTag(\`post-\${slug}\`);
    revalidatePath(\`/posts/\${slug}\`);
    revalidatePath("/posts");
    revalidatePath("/"); // Homepage might show recent posts
  },

  // Category-related revalidation
  category: (slug: string) => {
    revalidateTag("categories");
    revalidateTag(\`category-\${slug}\`);
    revalidatePath(\`/categories/\${slug}\`);
    revalidatePath("/categories");
  },

  // Full site revalidation (use sparingly)
  all: () => {
    revalidatePath("/", "layout");
  },
} as const;

/**
 * Create a custom revalidation function for an entity type.
 *
 * @example
 * const revalidateProduct = createRevalidator({
 *   tags: (id) => ["products", \`product-\${id}\`],
 *   paths: (id) => [\`/products/\${id}\`, "/products", "/shop"],
 * });
 *
 * // Later...
 * revalidateProduct("product-123");
 */
export function createRevalidator<T extends string | number>(config: {
  tags?: (id: T) => string[];
  paths?: (id: T) => string[];
}) {
  return (id: T) => {
    if (config.tags) {
      const tags = config.tags(id);
      for (const tag of tags) {
        revalidateTag(tag);
      }
    }

    if (config.paths) {
      const paths = config.paths(id);
      for (const path of paths) {
        revalidatePath(path);
      }
    }
  };
}
`,
      },
      {
        path: "app/posts/page.tsx",
        content: `import { cache, cacheConfig } from "@/lib/cache";

// Simulated database type
interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: Date;
}

// Cached data fetching function
const getPosts = cache(
  async (): Promise<Post[]> => {
    // Replace with your actual database query
    // return db.post.findMany({ orderBy: { publishedAt: "desc" } });

    // Simulated data for demonstration
    return [
      {
        id: "1",
        title: "Getting Started with Next.js Caching",
        slug: "nextjs-caching",
        excerpt: "Learn how to use Next.js built-in caching features...",
        publishedAt: new Date("2024-01-15"),
      },
      {
        id: "2",
        title: "Server Components Deep Dive",
        slug: "server-components",
        excerpt: "Understanding React Server Components...",
        publishedAt: new Date("2024-01-10"),
      },
    ];
  },
  ["posts", "list"],
  { tags: ["posts"], ...cacheConfig.medium }
);

export default async function PostsPage() {
  const posts = await getPosts();

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
      {
        path: "app/api/revalidate/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { revalidation } from "@/lib/revalidate";

// Secret token for webhook authentication
const REVALIDATION_TOKEN = process.env.REVALIDATION_TOKEN;

/**
 * On-demand revalidation endpoint.
 * Call this from CMS webhooks or admin actions.
 *
 * POST /api/revalidate
 * Body: { type: "post", id: "post-slug", token: "secret" }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, id, token } = body;

  // Validate token
  if (token !== REVALIDATION_TOKEN) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Validate required fields
  if (!type || !id) {
    return NextResponse.json(
      { error: "Missing type or id" },
      { status: 400 }
    );
  }

  // Perform revalidation based on type
  switch (type) {
    case "post":
      revalidation.post(id);
      break;
    case "user":
      revalidation.user(id);
      break;
    case "category":
      revalidation.category(id);
      break;
    case "all":
      revalidation.all();
      break;
    default:
      return NextResponse.json(
        { error: \`Unknown type: \${type}\` },
        { status: 400 }
      );
  }

  return NextResponse.json({
    revalidated: true,
    type,
    id,
    timestamp: Date.now(),
  });
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
