import type { Pattern } from "../../schema.js";

export const connectionPooling: Pattern = {
  name: "Connection Pooling",
  slug: "connection-pooling",
  description:
    "Database connection pooling for serverless and edge environments. Prevents connection exhaustion and handles cold starts gracefully.",
  category: "database",
  tier: "free",
  complexity: "beginner",
  tags: ["database", "prisma", "serverless", "edge", "postgresql"],
  alternatives: [
    {
      name: "PlanetScale",
      description: "Serverless MySQL platform with branching and automatic scaling",
      url: "https://planetscale.com",
      pricingTier: "freemium",
      pricingNote: "Free tier with 5GB storage, 1B row reads/mo",
      advantages: [
        "Built-in connection pooling",
        "Database branching for development",
        "Zero-downtime schema migrations",
        "No connection limits to worry about",
      ],
      recommended: true,
    },
    {
      name: "Neon",
      description: "Serverless Postgres with branching and autoscaling",
      url: "https://neon.tech",
      pricingTier: "freemium",
      pricingNote: "Free tier with 0.5GB storage",
      advantages: [
        "Serverless Postgres (no connection pooling needed)",
        "Database branching",
        "Autoscaling compute",
        "Point-in-time recovery",
      ],
    },
    {
      name: "Supabase",
      description: "Open source Firebase alternative with Postgres",
      url: "https://supabase.com",
      pricingTier: "freemium",
      pricingNote: "Free tier with 500MB database",
      advantages: [
        "Built-in Supavisor connection pooler",
        "Auth, storage, and realtime included",
        "Generous free tier",
        "Self-hostable",
      ],
    },
  ],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/db.ts",
        content: `import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await db.$disconnect();
});
`,
      },
      {
        path: "lib/db-edge.ts",
        content: `import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// For edge runtime - uses Prisma Accelerate for connection pooling
export const db = new PrismaClient().$extends(withAccelerate());

// Usage in edge functions:
// export const runtime = "edge";
// import { db } from "@/lib/db-edge";
`,
      },
      {
        path: ".env.example",
        content: `# Standard connection (for Node.js runtime)
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# Pooled connection (for serverless - use with PgBouncer, Supavisor, or Prisma Accelerate)
# DATABASE_URL="postgresql://user:password@pooler.example.com:6543/mydb?schema=public&pgbouncer=true"

# Prisma Accelerate (for edge runtime)
# DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=your_api_key"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "@prisma/client", version: "^6.0.0" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  devDependencies: {
    nextjs: [{ name: "prisma", version: "^6.0.0", dev: true }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
