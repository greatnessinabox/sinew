import type { Pattern } from "../../schema.js";

export const featureFlags: Pattern = {
  name: "Feature Flags",
  slug: "feature-flags",
  description:
    "Type-safe feature flags with gradual rollouts. Supports percentage-based rollouts, user targeting, and A/B testing using Vercel Edge Config or Upstash.",
  category: "developer-experience",
  frameworks: ["nextjs"],
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
      advantages: ["Sub-millisecond reads at edge", "Integrated with Vercel", "No SDK needed"],
      recommended: true,
    },
    {
      name: "LaunchDarkly",
      description: "Enterprise feature management platform",
      url: "https://launchdarkly.com",
      pricingTier: "paid",
      advantages: ["Enterprise features", "Advanced targeting", "Audit logs"],
    },
    {
      name: "Flagsmith",
      description: "Open-source feature flag service",
      url: "https://flagsmith.com",
      pricingTier: "freemium",
      advantages: ["Open source", "Self-hostable", "Free tier available"],
    },
    {
      name: "PostHog",
      description: "Product analytics with feature flags",
      url: "https://posthog.com/feature-flags",
      pricingTier: "freemium",
      advantages: ["Combined with analytics", "Experimentation built-in", "Open source"],
    },
  ],
  files: {
    nextjs: [
      {
        path: "lib/flags/config.ts",
        content: `import { z } from "zod";

// Define your feature flags with type safety
export const flagSchema = z.object({
  // Boolean flags
  newDashboard: z.boolean().default(false),
  darkMode: z.boolean().default(true),
  betaFeatures: z.boolean().default(false),

  // Percentage rollouts (0-100)
  newCheckoutPercentage: z.number().min(0).max(100).default(0),
  aiAssistantPercentage: z.number().min(0).max(100).default(0),

  // String variants for A/B testing
  pricingPageVariant: z.enum(["control", "variant-a", "variant-b"]).default("control"),
  ctaButtonText: z.enum(["Get Started", "Start Free Trial", "Try It Now"]).default("Get Started"),
});

export type Flags = z.infer<typeof flagSchema>;

// Default flag values
export const defaultFlags: Flags = flagSchema.parse({});

// Flag metadata for documentation
export const flagMetadata: Record<keyof Flags, { description: string; type: string }> = {
  newDashboard: {
    description: "Enable the redesigned dashboard",
    type: "boolean",
  },
  darkMode: {
    description: "Allow users to toggle dark mode",
    type: "boolean",
  },
  betaFeatures: {
    description: "Show beta features to users",
    type: "boolean",
  },
  newCheckoutPercentage: {
    description: "Percentage of users seeing new checkout flow",
    type: "percentage",
  },
  aiAssistantPercentage: {
    description: "Percentage of users with AI assistant enabled",
    type: "percentage",
  },
  pricingPageVariant: {
    description: "A/B test variant for pricing page",
    type: "variant",
  },
  ctaButtonText: {
    description: "CTA button text variant",
    type: "variant",
  },
};
`,
      },
      {
        path: "lib/flags/provider.ts",
        content: `import { get } from "@vercel/edge-config";
import { Redis } from "@upstash/redis";
import { flagSchema, defaultFlags, type Flags } from "./config";

// Choose provider based on environment
const PROVIDER = process.env.FLAGS_PROVIDER ?? "edge-config";

// Upstash Redis client (fallback)
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? Redis.fromEnv()
  : null;

// Get all flags
export async function getFlags(): Promise<Flags> {
  try {
    if (PROVIDER === "edge-config") {
      const flags = await get<Partial<Flags>>("flags");
      return flagSchema.parse({ ...defaultFlags, ...flags });
    } else if (redis) {
      const flags = await redis.hgetall<Partial<Flags>>("flags");
      return flagSchema.parse({ ...defaultFlags, ...flags });
    }
  } catch (error) {
    console.error("Error fetching flags:", error);
  }

  return defaultFlags;
}

// Get a single flag
export async function getFlag<K extends keyof Flags>(
  key: K
): Promise<Flags[K]> {
  const flags = await getFlags();
  return flags[key];
}

// Check if user is in percentage rollout
export function isInRollout(
  userId: string,
  percentage: number
): boolean {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;

  // Deterministic hash for consistent user experience
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const userPercentage = Math.abs(hash % 100);
  return userPercentage < percentage;
}

// Get flag with user targeting
export async function getFlagForUser<K extends keyof Flags>(
  key: K,
  userId?: string
): Promise<Flags[K]> {
  const value = await getFlag(key);

  // Handle percentage rollouts
  if (typeof value === "number" && userId) {
    return isInRollout(userId, value) as Flags[K];
  }

  return value;
}

// Check multiple flags at once
export async function checkFlags(
  keys: Array<keyof Flags>,
  userId?: string
): Promise<Partial<Flags>> {
  const flags = await getFlags();
  const result: Partial<Flags> = {};

  for (const key of keys) {
    const value = flags[key];
    if (typeof value === "number" && userId) {
      (result as Record<string, unknown>)[key] = isInRollout(userId, value);
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}
`,
      },
      {
        path: "components/feature-gate.tsx",
        content: `"use client";

import { createContext, useContext, ReactNode } from "react";
import type { Flags } from "@/lib/flags/config";

// Context for flags (populated server-side)
const FlagsContext = createContext<Partial<Flags>>({});

interface FlagsProviderProps {
  flags: Partial<Flags>;
  children: ReactNode;
}

export function FlagsProvider({ flags, children }: FlagsProviderProps) {
  return (
    <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>
  );
}

export function useFlags(): Partial<Flags> {
  return useContext(FlagsContext);
}

export function useFlag<K extends keyof Flags>(key: K): Flags[K] | undefined {
  const flags = useFlags();
  return flags[key];
}

// Component for conditionally rendering based on flag
interface FeatureGateProps {
  flag: keyof Flags;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const value = useFlag(flag);

  // Boolean flags
  if (typeof value === "boolean") {
    return value ? <>{children}</> : <>{fallback}</>;
  }

  // Percentage flags (assumed to be resolved to boolean by server)
  if (typeof value === "number") {
    // If still a number, treat as percentage > 0 being enabled
    return value > 0 ? <>{children}</> : <>{fallback}</>;
  }

  // String variants - render children if flag exists
  if (value !== undefined) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Component for A/B test variants
interface VariantGateProps<T extends string> {
  flag: keyof Flags;
  variant: T;
  children: ReactNode;
}

export function VariantGate<T extends string>({
  flag,
  variant,
  children,
}: VariantGateProps<T>) {
  const value = useFlag(flag);
  return value === variant ? <>{children}</> : null;
}
`,
      },
      {
        path: "app/api/flags/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { getFlags, getFlagForUser } from "@/lib/flags/provider";

// Get all flags (public endpoint)
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id") ?? undefined;

  try {
    const flags = await getFlags();

    // Resolve percentage flags for user if userId provided
    if (userId) {
      const resolved: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(flags)) {
        if (typeof value === "number") {
          resolved[key] = await getFlagForUser(key as keyof typeof flags, userId);
        } else {
          resolved[key] = value;
        }
      }
      return NextResponse.json(resolved);
    }

    return NextResponse.json(flags);
  } catch (error) {
    console.error("Error fetching flags:", error);
    return NextResponse.json(
      { error: "Failed to fetch flags" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: ".env.example",
        content: `# Feature Flags Provider: "edge-config" or "redis"
FLAGS_PROVIDER="edge-config"

# Vercel Edge Config (auto-configured on Vercel)
EDGE_CONFIG="https://edge-config.vercel.com/..."

# OR Upstash Redis (if using redis provider)
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
    nextjs: [{ name: "@vercel/edge-config" }, { name: "@upstash/redis" }, { name: "zod" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
