// Pattern data for the web app
// This mirrors the registry but is self-contained for the web build

export type PricingTier = "free" | "freemium" | "paid" | "enterprise";
export type Complexity = "beginner" | "intermediate" | "advanced";

export interface Alternative {
  name: string;
  description: string;
  url: string;
  pricingTier: PricingTier;
  pricingNote?: string;
  advantages: string[];
  recommended?: boolean;
}

export interface PatternFile {
  path: string;
  content: string;
}

export interface PatternDependency {
  name: string;
  version?: string;
  dev?: boolean;
}

export interface Prerequisite {
  name: string;
  version?: string;
  url?: string;
  description?: string;
}

export interface TestedWith {
  name: string;
  version: string;
  status: "passing" | "failing" | "untested";
}

export interface RelatedPattern {
  category: string;
  slug: string;
  name: string;
  relationship: "works-with" | "conflicts-with" | "extends" | "alternative";
}

export interface Pattern {
  name: string;
  slug: string;
  description: string;
  category: string;
  tier?: PricingTier;
  complexity?: Complexity;
  tags?: string[];
  alternatives?: Alternative[];
  files: PatternFile[];
  dependencies: PatternDependency[];
  devDependencies?: PatternDependency[];
  prerequisites?: Prerequisite[];
  testedWith?: TestedWith[];
  relatedPatterns?: RelatedPattern[];
}

// Import patterns from registry at build time
// For now, define the pattern metadata here (files are loaded separately)
export const patterns: Pattern[] = [
  // Database
  {
    name: "Connection Pooling",
    slug: "connection-pooling",
    description:
      "Database connection pooling for serverless and edge environments. Prevents connection exhaustion and handles cold starts gracefully.",
    category: "database",
    tier: "free",
    complexity: "beginner",
    tags: ["database", "prisma", "serverless", "edge", "postgresql"],
    prerequisites: [
      { name: "Node.js", version: "18+", url: "https://nodejs.org" },
      { name: "PostgreSQL", version: "14+", description: "Or any Prisma-supported database" },
    ],
    testedWith: [
      { name: "Next.js", version: "15.0", status: "passing" },
      { name: "Next.js", version: "14.2", status: "passing" },
      { name: "Prisma", version: "6.0", status: "passing" },
    ],
    relatedPatterns: [
      {
        category: "database",
        slug: "prisma-edge",
        name: "Prisma Edge Setup",
        relationship: "extends",
      },
      {
        category: "environment",
        slug: "type-safe-env",
        name: "Type-safe Env",
        relationship: "works-with",
      },
    ],
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
        ],
        recommended: true,
      },
      {
        name: "Neon",
        description: "Serverless Postgres with branching and autoscaling",
        url: "https://neon.tech",
        pricingTier: "freemium",
        pricingNote: "Free tier with 0.5GB storage",
        advantages: ["Serverless Postgres", "Database branching", "Autoscaling compute"],
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
        ],
      },
    ],
    files: [],
    dependencies: [{ name: "@prisma/client", version: "^6.0.0" }],
    devDependencies: [{ name: "prisma", version: "^6.0.0", dev: true }],
  },
  {
    name: "Prisma Edge Setup",
    slug: "prisma-edge",
    description: "Configure Prisma for edge runtime with Accelerate connection pooling.",
    category: "database",
    tier: "free",
    complexity: "intermediate",
    tags: ["database", "prisma", "edge", "accelerate"],
    files: [],
    dependencies: [{ name: "@prisma/client" }, { name: "@prisma/extension-accelerate" }],
  },
  {
    name: "Drizzle Config",
    slug: "drizzle-config",
    description: "Type-safe Drizzle ORM setup with migrations for PostgreSQL.",
    category: "database",
    tier: "free",
    complexity: "intermediate",
    tags: ["database", "drizzle", "orm", "postgresql"],
    files: [],
    dependencies: [{ name: "drizzle-orm" }, { name: "postgres" }],
    devDependencies: [{ name: "drizzle-kit", dev: true }],
  },
  // Auth
  {
    name: "OAuth Setup",
    slug: "oauth-setup",
    description:
      "Production-ready OAuth authentication with Auth.js (NextAuth v5). Includes GitHub and Google providers with database session storage.",
    category: "auth",
    tier: "free",
    complexity: "intermediate",
    tags: ["auth", "oauth", "nextauth", "session"],
    prerequisites: [
      { name: "Node.js", version: "18+", url: "https://nodejs.org" },
      { name: "Database", description: "PostgreSQL, MySQL, or any Prisma-supported database" },
      { name: "OAuth App", description: "GitHub and/or Google OAuth credentials" },
    ],
    testedWith: [
      { name: "Next.js", version: "15.0", status: "passing" },
      { name: "Auth.js", version: "5.0-beta", status: "passing" },
    ],
    relatedPatterns: [
      {
        category: "database",
        slug: "connection-pooling",
        name: "Connection Pooling",
        relationship: "works-with",
      },
      { category: "auth", slug: "sessions", name: "Session Management", relationship: "extends" },
      { category: "auth", slug: "rbac", name: "RBAC Patterns", relationship: "works-with" },
    ],
    alternatives: [
      {
        name: "Clerk",
        description:
          "Drop-in authentication with pre-built UI components, user management, and webhooks",
        url: "https://clerk.com",
        pricingTier: "freemium",
        pricingNote: "Free for 10,000 MAU, then $0.02/MAU",
        advantages: [
          "Pre-built sign-in/sign-up UI components",
          "User management dashboard included",
          "Built-in MFA, social login, and magic links",
        ],
        recommended: true,
      },
      {
        name: "Auth0",
        description: "Enterprise-grade identity platform with extensive customization",
        url: "https://auth0.com",
        pricingTier: "freemium",
        pricingNote: "Free for 7,500 MAU",
        advantages: ["Enterprise SSO (SAML, OIDC)", "Extensive compliance certifications"],
      },
    ],
    files: [],
    dependencies: [{ name: "next-auth", version: "beta" }, { name: "@auth/prisma-adapter" }],
  },
  {
    name: "Session Management",
    slug: "sessions",
    description: "Secure session handling with database storage and automatic cleanup.",
    category: "auth",
    tier: "free",
    complexity: "intermediate",
    tags: ["auth", "session", "security"],
    files: [],
    dependencies: [],
  },
  {
    name: "RBAC Patterns",
    slug: "rbac",
    description: "Role-based access control with permissions, roles, and middleware.",
    category: "auth",
    tier: "free",
    complexity: "advanced",
    tags: ["auth", "rbac", "permissions", "security"],
    files: [],
    dependencies: [],
  },
  // API
  {
    name: "Rate Limiting",
    slug: "rate-limiting",
    description: "API rate limiting with sliding window algorithm using Upstash Redis.",
    category: "api",
    tier: "freemium",
    complexity: "intermediate",
    tags: ["api", "rate-limiting", "redis", "security"],
    files: [],
    dependencies: [{ name: "@upstash/ratelimit" }, { name: "@upstash/redis" }],
  },
  {
    name: "API Validation",
    slug: "api-validation",
    description: "Type-safe request/response validation with Zod schemas.",
    category: "api",
    tier: "free",
    complexity: "beginner",
    tags: ["api", "validation", "zod", "typescript"],
    files: [],
    dependencies: [{ name: "zod" }],
  },
  {
    name: "Error Handling",
    slug: "error-handling",
    description: "Consistent error handling with custom error classes and structured responses.",
    category: "api",
    tier: "free",
    complexity: "beginner",
    tags: ["api", "error-handling", "middleware"],
    files: [],
    dependencies: [],
  },
  // Testing
  {
    name: "Vitest Setup",
    slug: "vitest-setup",
    description: "Unit and integration testing with Vitest and React Testing Library.",
    category: "testing",
    tier: "free",
    complexity: "beginner",
    tags: ["testing", "vitest", "unit-tests"],
    files: [],
    dependencies: [],
    devDependencies: [
      { name: "vitest", dev: true },
      { name: "@testing-library/react", dev: true },
    ],
  },
  {
    name: "Playwright E2E",
    slug: "playwright-e2e",
    description: "End-to-end testing with Playwright and page object patterns.",
    category: "testing",
    tier: "free",
    complexity: "intermediate",
    tags: ["testing", "playwright", "e2e"],
    files: [],
    dependencies: [],
    devDependencies: [{ name: "@playwright/test", dev: true }],
  },
  {
    name: "MSW Mocking",
    slug: "msw-mocking",
    description: "API mocking with Mock Service Worker for tests and development.",
    category: "testing",
    tier: "free",
    complexity: "intermediate",
    tags: ["testing", "mocking", "msw", "api"],
    files: [],
    dependencies: [],
    devDependencies: [{ name: "msw", dev: true }],
  },
  {
    name: "Component Testing",
    slug: "component-testing",
    description:
      "React component testing with Testing Library, user events, and accessibility testing.",
    category: "testing",
    tier: "free",
    complexity: "beginner",
    tags: ["testing", "react", "testing-library", "components"],
    files: [],
    dependencies: [],
    devDependencies: [
      { name: "@testing-library/react", dev: true },
      { name: "@testing-library/user-event", dev: true },
    ],
  },
  // Caching
  {
    name: "Redis Cache",
    slug: "redis-cache",
    description:
      "Redis caching with Upstash. Includes cache utilities, automatic serialization, and cache invalidation patterns.",
    category: "caching",
    tier: "freemium",
    complexity: "intermediate",
    tags: ["caching", "redis", "upstash", "serverless"],
    alternatives: [
      {
        name: "Vercel KV",
        description: "Durable Redis database built on Upstash, integrated with Vercel",
        url: "https://vercel.com/storage/kv",
        pricingTier: "freemium",
        pricingNote: "Free tier with 3,000 requests/day",
        advantages: ["Zero config on Vercel", "Same Upstash Redis under the hood"],
        recommended: true,
      },
    ],
    files: [],
    dependencies: [{ name: "@upstash/redis" }],
  },
  {
    name: "Next.js Cache",
    slug: "nextjs-cache",
    description: "Next.js built-in caching with unstable_cache, revalidatePath, and revalidateTag.",
    category: "caching",
    tier: "free",
    complexity: "beginner",
    tags: ["caching", "nextjs", "serverless", "vercel"],
    files: [],
    dependencies: [],
  },
  {
    name: "In-Memory Cache",
    slug: "in-memory-cache",
    description: "Simple LRU in-memory caching for serverless. No external dependencies.",
    category: "caching",
    tier: "free",
    complexity: "beginner",
    tags: ["caching", "lru", "serverless", "no-dependencies"],
    files: [],
    dependencies: [],
  },
  // Email
  {
    name: "Resend Email",
    slug: "resend-email",
    description: "Transactional email with Resend and React Email templates.",
    category: "email",
    tier: "freemium",
    complexity: "beginner",
    tags: ["email", "resend", "transactional"],
    files: [],
    dependencies: [{ name: "resend" }, { name: "@react-email/components" }],
  },
  {
    name: "Nodemailer Setup",
    slug: "nodemailer",
    description: "Free email sending with Nodemailer. Supports SMTP, Gmail, and other providers.",
    category: "email",
    tier: "free",
    complexity: "beginner",
    tags: ["email", "nodemailer", "smtp", "transactional"],
    files: [],
    dependencies: [{ name: "nodemailer" }],
    devDependencies: [{ name: "@types/nodemailer", dev: true }],
  },
  {
    name: "AWS SES",
    slug: "aws-ses",
    description: "Cost-effective email at scale with AWS Simple Email Service.",
    category: "email",
    tier: "paid",
    complexity: "intermediate",
    tags: ["email", "aws", "ses", "transactional"],
    files: [],
    dependencies: [{ name: "@aws-sdk/client-ses" }],
  },
  // Payments
  {
    name: "Stripe Payments",
    slug: "stripe-payments",
    description:
      "Stripe integration with checkout sessions, webhook handling, and subscription management.",
    category: "payments",
    tier: "free",
    complexity: "intermediate",
    tags: ["payments", "stripe", "subscriptions", "webhooks"],
    alternatives: [
      {
        name: "LemonSqueezy",
        description: "All-in-one platform for SaaS with built-in tax handling",
        url: "https://lemonsqueezy.com",
        pricingTier: "paid",
        pricingNote: "5% + $0.50 per transaction",
        advantages: [
          "Merchant of Record (handles global tax compliance)",
          "Simpler setup than Stripe",
        ],
        recommended: true,
      },
    ],
    files: [],
    dependencies: [{ name: "stripe" }],
  },
  {
    name: "LemonSqueezy",
    slug: "lemonsqueezy",
    description:
      "Payment integration with LemonSqueezy. Includes checkout, webhooks, and subscriptions with built-in tax handling.",
    category: "payments",
    tier: "free",
    complexity: "intermediate",
    tags: ["payments", "lemonsqueezy", "subscriptions", "webhooks"],
    files: [],
    dependencies: [{ name: "@lemonsqueezy/lemonsqueezy.js" }],
  },
  {
    name: "Usage-Based Billing",
    slug: "usage-billing",
    description:
      "Metered billing with Stripe. Track usage, report to Stripe, and charge customers based on consumption.",
    category: "payments",
    tier: "free",
    complexity: "advanced",
    tags: ["payments", "stripe", "metered", "usage-based"],
    files: [],
    dependencies: [{ name: "stripe" }],
  },
  // Monitoring
  {
    name: "Sentry Monitoring",
    slug: "sentry-monitoring",
    description:
      "Error tracking and performance monitoring with Sentry. Includes source maps and custom context.",
    category: "monitoring",
    tier: "freemium",
    complexity: "beginner",
    tags: ["monitoring", "error-tracking", "performance", "sentry"],
    alternatives: [
      {
        name: "Axiom",
        description: "Modern observability platform with unlimited data retention",
        url: "https://axiom.co",
        pricingTier: "freemium",
        pricingNote: "Free tier with 500GB/mo ingest",
        advantages: [
          "Unlimited data retention on free tier",
          "Logs, traces, and metrics in one platform",
        ],
        recommended: true,
      },
    ],
    files: [],
    dependencies: [{ name: "@sentry/nextjs" }],
  },
  {
    name: "OpenTelemetry",
    slug: "opentelemetry",
    description:
      "Open standard observability with OpenTelemetry. Works with Jaeger, Zipkin, and commercial backends.",
    category: "monitoring",
    tier: "free",
    complexity: "intermediate",
    tags: ["monitoring", "observability", "tracing", "opentelemetry"],
    files: [],
    dependencies: [{ name: "@opentelemetry/api" }, { name: "@opentelemetry/sdk-node" }],
  },
  {
    name: "Structured Logging",
    slug: "logging",
    description:
      "Structured JSON logging with Pino. Fast, low-overhead logging with log levels and context.",
    category: "monitoring",
    tier: "free",
    complexity: "beginner",
    tags: ["logging", "pino", "observability", "json"],
    files: [],
    dependencies: [{ name: "pino" }],
    devDependencies: [{ name: "pino-pretty", dev: true }],
  },
  // Environment
  {
    name: "Type-safe Env",
    slug: "type-safe-env",
    description: "Runtime-validated environment variables with Zod and TypeScript.",
    category: "environment",
    tier: "free",
    complexity: "beginner",
    tags: ["environment", "zod", "typescript", "validation"],
    files: [],
    dependencies: [{ name: "zod" }],
  },
  {
    name: "Secrets Management",
    slug: "secrets",
    description: "Secure secrets handling with encryption at rest across environments.",
    category: "environment",
    tier: "free",
    complexity: "intermediate",
    tags: ["environment", "secrets", "security", "encryption"],
    files: [],
    dependencies: [],
  },
  // Deployment
  {
    name: "Docker Config",
    slug: "docker",
    description: "Multi-stage Docker builds optimized for Next.js.",
    category: "deployment",
    tier: "free",
    complexity: "intermediate",
    tags: ["deployment", "docker", "containers", "nextjs"],
    files: [],
    dependencies: [],
  },
  {
    name: "GitHub Actions",
    slug: "github-actions",
    description: "CI/CD pipelines for testing, building, and deploying.",
    category: "deployment",
    tier: "free",
    complexity: "intermediate",
    tags: ["deployment", "ci-cd", "github", "automation"],
    files: [],
    dependencies: [],
  },
  {
    name: "Vercel Config",
    slug: "vercel",
    description:
      "Vercel deployment configuration with edge functions, environment setup, and build optimizations.",
    category: "deployment",
    tier: "free",
    complexity: "beginner",
    tags: ["deployment", "vercel", "edge", "serverless"],
    files: [],
    dependencies: [],
  },
  // Developer Experience
  {
    name: "Feature Flags",
    slug: "feature-flags",
    description:
      "Type-safe feature flags with gradual rollouts. Supports percentage-based rollouts, user targeting, and A/B testing using Vercel Edge Config or Upstash.",
    category: "developer-experience",
    tier: "freemium",
    complexity: "intermediate",
    tags: ["feature-flags", "rollout", "ab-testing", "edge-config"],
    alternatives: [
      {
        name: "Vercel Edge Config",
        description: "Ultra-low latency feature flags at the edge",
        url: "https://vercel.com/docs/storage/edge-config",
        pricingTier: "freemium",
        pricingNote: "Included with Vercel Pro",
        advantages: ["Sub-millisecond reads at edge", "Integrated with Vercel"],
        recommended: true,
      },
      {
        name: "LaunchDarkly",
        description: "Enterprise feature management platform",
        url: "https://launchdarkly.com",
        pricingTier: "paid",
        advantages: ["Enterprise features", "Advanced targeting"],
      },
      {
        name: "Flagsmith",
        description: "Open-source feature flag service",
        url: "https://flagsmith.com",
        pricingTier: "freemium",
        advantages: ["Open source", "Self-hostable"],
      },
    ],
    files: [],
    dependencies: [{ name: "@vercel/edge-config" }, { name: "@upstash/redis" }, { name: "zod" }],
  },
  {
    name: "Analytics",
    slug: "analytics",
    description:
      "Privacy-friendly analytics with PostHog. Includes event tracking, user identification, and feature flag integration.",
    category: "developer-experience",
    tier: "freemium",
    complexity: "beginner",
    tags: ["analytics", "posthog", "tracking", "events", "privacy"],
    alternatives: [
      {
        name: "PostHog",
        description: "Open-source product analytics with feature flags",
        url: "https://posthog.com",
        pricingTier: "freemium",
        pricingNote: "Free tier with 1M events/month",
        advantages: ["Open source", "Self-hostable", "Feature flags included"],
        recommended: true,
      },
      {
        name: "Plausible",
        description: "Simple, privacy-focused web analytics",
        url: "https://plausible.io",
        pricingTier: "paid",
        pricingNote: "From $9/month",
        advantages: ["Privacy-focused", "No cookies required", "GDPR compliant"],
      },
      {
        name: "Umami",
        description: "Open-source, privacy-focused analytics",
        url: "https://umami.is",
        pricingTier: "free",
        advantages: ["Free and open source", "Self-hostable"],
      },
    ],
    files: [],
    dependencies: [{ name: "posthog-js" }, { name: "posthog-node" }],
  },
  {
    name: "Search",
    slug: "search",
    description:
      "Full-text search with typo tolerance, filters, and facets using Meilisearch. Includes indexing utilities and React hooks.",
    category: "developer-experience",
    tier: "freemium",
    complexity: "intermediate",
    tags: ["search", "meilisearch", "full-text", "filters", "facets"],
    alternatives: [
      {
        name: "Algolia",
        description: "Industry-leading search-as-a-service",
        url: "https://algolia.com",
        pricingTier: "freemium",
        pricingNote: "Free tier with 10K searches/month",
        advantages: ["Industry standard", "Excellent documentation"],
      },
      {
        name: "Meilisearch",
        description: "Open-source, typo-tolerant search engine",
        url: "https://meilisearch.com",
        pricingTier: "freemium",
        pricingNote: "Free self-hosted, cloud from $30/month",
        advantages: ["Open source", "Easy to self-host", "Great typo tolerance"],
        recommended: true,
      },
      {
        name: "Typesense",
        description: "Open-source alternative to Algolia",
        url: "https://typesense.org",
        pricingTier: "freemium",
        advantages: ["Open source", "Self-hostable", "Geographic search"],
      },
    ],
    files: [],
    dependencies: [{ name: "meilisearch" }],
  },
  {
    name: "Internationalization",
    slug: "i18n",
    description:
      "Type-safe internationalization with next-intl. Includes locale detection, server components support, and message formatting.",
    category: "developer-experience",
    tier: "free",
    complexity: "intermediate",
    tags: ["i18n", "internationalization", "localization", "next-intl"],
    files: [],
    dependencies: [{ name: "next-intl" }],
  },
  {
    name: "Content Moderation",
    slug: "content-moderation",
    description:
      "AI-powered content moderation for user-generated content. Uses OpenAI's free moderation API for text.",
    category: "developer-experience",
    tier: "freemium",
    complexity: "intermediate",
    tags: ["moderation", "content", "safety", "openai", "ugc"],
    alternatives: [
      {
        name: "OpenAI Moderation",
        description: "Free content moderation API from OpenAI",
        url: "https://platform.openai.com/docs/guides/moderation",
        pricingTier: "free",
        advantages: ["Free to use", "Multiple categories", "Fast response"],
        recommended: true,
      },
      {
        name: "Perspective API",
        description: "Google's toxicity detection API",
        url: "https://perspectiveapi.com",
        pricingTier: "free",
        pricingNote: "Free with rate limits",
        advantages: ["Toxicity scoring", "Multiple languages"],
      },
    ],
    files: [],
    dependencies: [{ name: "openai" }],
  },
];

export function getPattern(category: string, slug: string): Pattern | undefined {
  return patterns.find((p) => p.category === category && p.slug === slug);
}

export function getPatternsByCategory(category: string): Pattern[] {
  return patterns.filter((p) => p.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(patterns.map((p) => p.category))];
}

// Category display names (for homepage/UI)
const categoryDisplayNames: Record<string, string> = {
  database: "Database",
  auth: "Authentication",
  api: "API",
  testing: "Testing",
  caching: "Caching",
  email: "Email",
  payments: "Payments",
  monitoring: "Monitoring",
  environment: "Environment",
  deployment: "Deployment",
  "developer-experience": "Developer Experience",
};

// Category descriptions (for homepage)
const categoryDescriptions: Record<string, string> = {
  database: "Connection pooling, ORMs, and serverless-ready database patterns",
  auth: "OAuth, sessions, and role-based access control",
  api: "Rate limiting, validation, and error handling",
  testing: "Unit, integration, and end-to-end testing",
  caching: "Redis caching and data management",
  email: "Transactional email and templates",
  payments: "Stripe integration and subscriptions",
  monitoring: "Error tracking and observability",
  environment: "Type-safe configs and secrets management",
  deployment: "Docker, CI/CD, and production-ready configs",
  "developer-experience": "Feature flags, analytics, search, and internationalization",
};

export interface CategoryGroup {
  category: string;
  slug: string;
  description: string;
  count: number;
  items: { name: string; slug: string; ready: boolean }[];
}

export function getPatternGroups(): CategoryGroup[] {
  const categories = getAllCategories();
  return categories.map((category) => {
    const categoryPatterns = getPatternsByCategory(category);
    return {
      category: categoryDisplayNames[category] ?? category,
      slug: category,
      description: categoryDescriptions[category] ?? "",
      count: categoryPatterns.length,
      items: categoryPatterns.map((p) => ({
        name: p.name,
        slug: p.slug,
        ready: true,
      })),
    };
  });
}

export function getTotalPatternCount(): number {
  return patterns.length;
}

// Featured patterns configuration (slugs for homepage showcase)
const featuredPatternSlugs = [
  { category: "database", slug: "connection-pooling" },
  { category: "auth", slug: "oauth-setup" },
  { category: "api", slug: "rate-limiting" },
  { category: "environment", slug: "type-safe-env" },
  { category: "deployment", slug: "docker" },
  { category: "testing", slug: "vitest-setup" },
];

export interface FeaturedPattern {
  category: string;
  slug: string;
  name: string;
  description: string;
  command: string;
}

export function getFeaturedPatterns(): FeaturedPattern[] {
  return featuredPatternSlugs
    .map(({ category, slug }) => {
      const pattern = getPattern(category, slug);
      if (!pattern) return null;
      return {
        category,
        slug,
        name: pattern.name,
        description: pattern.description,
        command: `sinew add ${category}/${slug}`,
      };
    })
    .filter((p): p is FeaturedPattern => p !== null);
}
