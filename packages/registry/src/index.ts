export * from "./schema.js";

// Database patterns
export { connectionPooling, prismaEdge, drizzleConfig } from "./patterns/database/index.js";

// Auth patterns
export { oauthSetup, sessions, rbac } from "./patterns/auth/index.js";

// Environment patterns
export { typeSafeEnv, secrets } from "./patterns/environment/index.js";

// Deployment patterns
export { docker, githubActions, vercel } from "./patterns/deployment/index.js";

// API patterns
export { rateLimiting, apiValidation, errorHandling } from "./patterns/api/index.js";

// Testing patterns
export {
  vitestSetup,
  playwrightE2e,
  mswMocking,
  componentTesting,
} from "./patterns/testing/index.js";

// Caching patterns
export { redisCache, nextjsCache, inMemoryCache } from "./patterns/caching/index.js";

// Email patterns
export { resendEmail, nodemailer, awsSes } from "./patterns/email/index.js";

// Payments patterns
export { stripePayments, lemonsqueezy, usageBilling } from "./patterns/payments/index.js";

// Monitoring patterns
export { sentryMonitoring, opentelemetry, logging } from "./patterns/monitoring/index.js";

// AI patterns
export {
  aiChat,
  aiEmbeddings,
  aiToolCalling,
  aiRateLimits,
  aiStreamingUi,
} from "./patterns/ai/index.js";

import { connectionPooling, prismaEdge, drizzleConfig } from "./patterns/database/index.js";
import { oauthSetup, sessions, rbac } from "./patterns/auth/index.js";
import { typeSafeEnv, secrets } from "./patterns/environment/index.js";
import { docker, githubActions, vercel } from "./patterns/deployment/index.js";
import { rateLimiting, apiValidation, errorHandling } from "./patterns/api/index.js";
import {
  vitestSetup,
  playwrightE2e,
  mswMocking,
  componentTesting,
} from "./patterns/testing/index.js";
import { redisCache, nextjsCache, inMemoryCache } from "./patterns/caching/index.js";
import { resendEmail, nodemailer, awsSes } from "./patterns/email/index.js";
import { stripePayments, lemonsqueezy, usageBilling } from "./patterns/payments/index.js";
import { sentryMonitoring, opentelemetry, logging } from "./patterns/monitoring/index.js";
import {
  aiChat,
  aiEmbeddings,
  aiToolCalling,
  aiRateLimits,
  aiStreamingUi,
} from "./patterns/ai/index.js";
import type { Pattern } from "./schema.js";

export const patterns: Pattern[] = [
  // Database
  connectionPooling,
  prismaEdge,
  drizzleConfig,
  // Auth
  oauthSetup,
  sessions,
  rbac,
  // Environment
  typeSafeEnv,
  secrets,
  // Deployment
  docker,
  githubActions,
  vercel,
  // API
  rateLimiting,
  apiValidation,
  errorHandling,
  // Testing
  vitestSetup,
  playwrightE2e,
  mswMocking,
  componentTesting,
  // Caching
  redisCache,
  nextjsCache,
  inMemoryCache,
  // Email
  resendEmail,
  nodemailer,
  awsSes,
  // Payments
  stripePayments,
  lemonsqueezy,
  usageBilling,
  // Monitoring
  sentryMonitoring,
  opentelemetry,
  logging,
  // AI
  aiChat,
  aiEmbeddings,
  aiToolCalling,
  aiRateLimits,
  aiStreamingUi,
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
