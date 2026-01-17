import type { Pattern } from "../../schema.js";

export const typeSafeEnv: Pattern = {
  name: "Type-safe Env",
  slug: "type-safe-env",
  description:
    "Runtime-validated environment variables with Zod and TypeScript. Catch missing or invalid env vars at build time, not in production.",
  category: "environment",
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/env/server.ts",
        content: `import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
`,
      },
      {
        path: "lib/env/client.ts",
        content: `import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default("My App"),
});

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

if (!parsed.success) {
  console.error("Invalid client environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid client environment variables");
}

export const clientEnv = parsed.data;
`,
      },
      {
        path: ".env.example",
        content: `# Server-side (never exposed to browser)
NODE_ENV="development"
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
AUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth (optional)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Client-side (exposed to browser, prefix with NEXT_PUBLIC_)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="My App"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "zod" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
