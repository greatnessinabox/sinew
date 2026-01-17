import type { Pattern } from "../../schema.js";

export const drizzleConfig: Pattern = {
  name: "Drizzle Config",
  slug: "drizzle-config",
  description:
    "Type-safe Drizzle ORM setup with migrations, connection pooling, and schema management.",
  category: "database",
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/db/index.ts",
        content: `import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Connection pool for serverless
const client = postgres(connectionString, {
  max: 10, // Max connections
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
`,
      },
      {
        path: "lib/db/schema.ts",
        content: `import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export types for use in your app
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`,
      },
      {
        path: "lib/db/migrate.ts",
        content: `import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

async function main() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete!");
  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
`,
      },
      {
        path: "drizzle.config.ts",
        content: `import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
`,
      },
      {
        path: ".env.example",
        content: `# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "drizzle-orm" }, { name: "postgres" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  devDependencies: {
    nextjs: [{ name: "drizzle-kit", dev: true }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
