import type { Pattern } from "../../schema.js";

export const sentryMonitoring: Pattern = {
  name: "Sentry Monitoring",
  slug: "sentry-monitoring",
  description:
    "Error tracking and performance monitoring with Sentry. Includes source maps, custom context, and alert configuration.",
  category: "monitoring",
  tier: "freemium",
  complexity: "beginner",
  tags: ["monitoring", "error-tracking", "performance", "sentry", "observability"],
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
        "Powerful query language",
        "Great Next.js integration",
      ],
      recommended: true,
    },
    {
      name: "BetterStack (Logtail)",
      description: "Log management and uptime monitoring",
      url: "https://betterstack.com",
      pricingTier: "freemium",
      pricingNote: "Free tier with 1GB/mo",
      advantages: [
        "Beautiful UI for log exploration",
        "Uptime monitoring included",
        "Incident management",
        "Affordable pricing",
      ],
    },
    {
      name: "Highlight.io",
      description: "Open source fullstack monitoring (errors, logs, traces, sessions)",
      url: "https://highlight.io",
      pricingTier: "freemium",
      pricingNote: "Free tier with 500 sessions/mo",
      advantages: [
        "Open source and self-hostable",
        "Session replay included",
        "Full stack coverage",
        "Great developer experience",
      ],
    },
  ],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "sentry.client.config.ts",
        content: `import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay (optional)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Ignore common non-errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
  ],

  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    return event;
  },
});
`,
      },
      {
        path: "sentry.server.config.ts",
        content: `import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
});
`,
      },
      {
        path: "sentry.edge.config.ts",
        content: `import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV === "production",
});
`,
      },
      {
        path: "lib/sentry.ts",
        content: `import * as Sentry from "@sentry/nextjs";

// Set user context after authentication
export function setUserContext(user: {
  id: string;
  email?: string;
  name?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}

// Clear user context on logout
export function clearUserContext() {
  Sentry.setUser(null);
}

// Add custom context to errors
export function setContext(name: string, context: Record<string, unknown>) {
  Sentry.setContext(name, context);
}

// Capture a custom error with context
export function captureError(
  error: Error,
  context?: Record<string, unknown>
) {
  if (context) {
    Sentry.setContext("custom", context);
  }
  Sentry.captureException(error);
}

// Capture a message
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}

// Create a transaction for performance monitoring
export function startTransaction(
  name: string,
  op: string
): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({ name, op });
}

// Wrap an async function with error handling
export async function withSentry<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan({ name }, async () => {
    try {
      return await fn();
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  });
}
`,
      },
      {
        path: "instrumentation.ts",
        content: `export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
`,
      },
      {
        path: "next.config.ts",
        content: `import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Your Next.js config here
};

export default withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in production
  silent: process.env.NODE_ENV !== "production",

  // Upload source maps to Sentry
  widenClientFileUpload: true,

  // Hide source maps from being downloadable
  hideSourceMaps: true,

  // Disable the Sentry SDK for the build step
  disableLogger: true,
});
`,
      },
      {
        path: ".env.example",
        content: `# Sentry DSN (get from Sentry project settings)
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# Sentry organization and project (for source maps)
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"

# Sentry auth token (for uploading source maps)
SENTRY_AUTH_TOKEN="sntrys_xxx"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "@sentry/nextjs" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
