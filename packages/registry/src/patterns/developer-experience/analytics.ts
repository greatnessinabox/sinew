import type { Pattern } from "../../schema.js";

export const analytics: Pattern = {
  name: "Analytics",
  slug: "analytics",
  description:
    "Privacy-friendly analytics with PostHog. Includes event tracking, user identification, and feature flag integration.",
  category: "developer-experience",
  frameworks: ["nextjs"],
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
      advantages: ["Open source", "Self-hostable", "Feature flags included", "Session recordings"],
      recommended: true,
    },
    {
      name: "Plausible",
      description: "Simple, privacy-focused web analytics",
      url: "https://plausible.io",
      pricingTier: "paid",
      pricingNote: "From $9/month",
      advantages: ["Privacy-focused", "No cookies required", "Simple dashboard", "GDPR compliant"],
    },
    {
      name: "Umami",
      description: "Open-source, privacy-focused analytics",
      url: "https://umami.is",
      pricingTier: "free",
      advantages: ["Free and open source", "Self-hostable", "No cookies", "Simple setup"],
    },
    {
      name: "Mixpanel",
      description: "Product analytics for user behavior",
      url: "https://mixpanel.com",
      pricingTier: "freemium",
      pricingNote: "Free tier with 20M events/month",
      advantages: ["Advanced funnel analysis", "Cohort analysis", "A/B testing"],
    },
  ],
  files: {
    nextjs: [
      {
        path: "lib/analytics/client.ts",
        content: `import posthog from "posthog-js";

// Initialize PostHog (call once in your app)
export function initAnalytics() {
  if (typeof window === "undefined") return;
  if (posthog.__loaded) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    // Recommended settings for Next.js
    capture_pageview: false, // We'll capture manually
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    // Privacy settings
    disable_session_recording: false,
    mask_all_text: false,
    mask_all_element_attributes: false,
  });
}

// Get PostHog instance
export function getPostHog() {
  return posthog;
}

// Identify user (call after login)
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
) {
  posthog.identify(userId, properties);
}

// Reset user (call after logout)
export function resetUser() {
  posthog.reset();
}

// Track page view
export function trackPageView(url?: string) {
  posthog.capture("$pageview", {
    $current_url: url || window.location.href,
  });
}

// Track custom event
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  posthog.capture(event, properties);
}

// Set user properties
export function setUserProperties(properties: Record<string, unknown>) {
  posthog.people.set(properties);
}

// Set user property once (won't overwrite)
export function setUserPropertyOnce(properties: Record<string, unknown>) {
  posthog.people.set_once(properties);
}

// Increment numeric property
export function incrementProperty(property: string, value = 1) {
  posthog.people.increment(property, value);
}

// Feature flags from PostHog
export function isFeatureEnabled(flag: string): boolean {
  return posthog.isFeatureEnabled(flag) ?? false;
}

export function getFeatureFlag(flag: string): string | boolean | undefined {
  return posthog.getFeatureFlag(flag);
}
`,
      },
      {
        path: "lib/analytics/events.ts",
        content: `import { trackEvent } from "./client";

// Type-safe event tracking
// Define your events here for consistency and autocomplete

export const Events = {
  // User events
  signUp: (method: "email" | "google" | "github") =>
    trackEvent("user_signed_up", { method }),

  login: (method: "email" | "google" | "github") =>
    trackEvent("user_logged_in", { method }),

  logout: () => trackEvent("user_logged_out"),

  // Feature usage
  featureUsed: (feature: string, properties?: Record<string, unknown>) =>
    trackEvent("feature_used", { feature, ...properties }),

  // Conversion events
  trialStarted: (plan: string) =>
    trackEvent("trial_started", { plan }),

  subscriptionStarted: (plan: string, interval: "monthly" | "yearly") =>
    trackEvent("subscription_started", { plan, interval }),

  subscriptionCancelled: (plan: string, reason?: string) =>
    trackEvent("subscription_cancelled", { plan, reason }),

  // E-commerce events
  productViewed: (productId: string, name: string, price: number) =>
    trackEvent("product_viewed", { productId, name, price }),

  addedToCart: (productId: string, quantity: number, price: number) =>
    trackEvent("added_to_cart", { productId, quantity, price }),

  checkoutStarted: (cartTotal: number, itemCount: number) =>
    trackEvent("checkout_started", { cartTotal, itemCount }),

  purchaseCompleted: (orderId: string, total: number, items: number) =>
    trackEvent("purchase_completed", { orderId, total, items }),

  // Engagement events
  searchPerformed: (query: string, resultsCount: number) =>
    trackEvent("search_performed", { query, resultsCount }),

  contentShared: (contentType: string, platform: string) =>
    trackEvent("content_shared", { contentType, platform }),

  feedbackSubmitted: (type: "bug" | "feature" | "general", rating?: number) =>
    trackEvent("feedback_submitted", { type, rating }),

  // Error tracking
  errorOccurred: (errorType: string, message: string, stack?: string) =>
    trackEvent("error_occurred", { errorType, message, stack }),
};

// Helper for timing events
export function trackTiming(
  eventName: string,
  startTime: number,
  properties?: Record<string, unknown>
) {
  const duration = Date.now() - startTime;
  trackEvent(eventName, { duration, ...properties });
}
`,
      },
      {
        path: "components/analytics-provider.tsx",
        content: `"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics, trackPageView } from "@/lib/analytics/client";

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize PostHog on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      const url = searchParams.toString()
        ? \`\${pathname}?\${searchParams.toString()}\`
        : pathname;
      trackPageView(url);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
`,
      },
      {
        path: "lib/analytics/server.ts",
        content: `import { PostHog } from "posthog-node";

// Server-side PostHog client
let posthogServer: PostHog | null = null;

export function getServerPostHog(): PostHog {
  if (!posthogServer) {
    posthogServer = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      flushAt: 1, // Send events immediately in serverless
      flushInterval: 0,
    });
  }
  return posthogServer;
}

// Track server-side event
export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const posthog = getServerPostHog();
  posthog.capture({
    distinctId,
    event,
    properties,
  });
  await posthog.flush();
}

// Identify user server-side
export async function identifyServerUser(
  distinctId: string,
  properties?: Record<string, unknown>
) {
  const posthog = getServerPostHog();
  posthog.identify({
    distinctId,
    properties,
  });
  await posthog.flush();
}

// Get feature flag server-side
export async function getServerFeatureFlag(
  distinctId: string,
  flag: string
): Promise<string | boolean | undefined> {
  const posthog = getServerPostHog();
  return await posthog.getFeatureFlag(flag, distinctId);
}

// Shutdown (call in cleanup)
export async function shutdownAnalytics() {
  if (posthogServer) {
    await posthogServer.shutdown();
    posthogServer = null;
  }
}
`,
      },
      {
        path: "app/layout.tsx.example",
        content: `// Example: Add AnalyticsProvider to your root layout

import { Suspense } from "react";
import { AnalyticsProvider } from "@/components/analytics-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </Suspense>
      </body>
    </html>
  );
}
`,
      },
      {
        path: ".env.example",
        content: `# PostHog (https://posthog.com)
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# Or use EU cloud
# NEXT_PUBLIC_POSTHOG_HOST="https://eu.posthog.com"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "posthog-js" }, { name: "posthog-node" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
