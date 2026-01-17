import type { Pattern } from "../../schema.js";

export const prismaEdge: Pattern = {
  name: "Prisma Edge Setup",
  slug: "prisma-edge",
  description:
    "Configure Prisma for edge runtime with Accelerate. HTTP-based connection pooling that works without TCP connections.",
  category: "database",
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/db-edge.ts",
        content: `import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// Edge-compatible Prisma client using Accelerate
// Use this in routes with: export const runtime = "edge"
export const db = new PrismaClient().$extends(withAccelerate());

// Example usage in an edge API route:
// export const runtime = "edge";
//
// import { db } from "@/lib/db-edge";
//
// export async function GET() {
//   const users = await db.user.findMany({
//     cacheStrategy: { ttl: 60 }, // Cache for 60 seconds
//   });
//   return Response.json(users);
// }
`,
      },
      {
        path: "lib/db.ts",
        content: `import { PrismaClient } from "@prisma/client";

// Standard Prisma client for Node.js runtime
// Use this in routes WITHOUT "edge" runtime
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
`,
      },
      {
        path: "prisma/schema.prisma",
        content: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
}

// Your models here
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`,
      },
      {
        path: ".env.example",
        content: `# Prisma Accelerate connection (for edge runtime)
# Get your connection string from: https://console.prisma.io
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"

# Direct database connection (for migrations and development)
DIRECT_URL="postgresql://user:password@localhost:5432/mydb"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "@prisma/client" }, { name: "@prisma/extension-accelerate" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  devDependencies: {
    nextjs: [{ name: "prisma", dev: true }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
