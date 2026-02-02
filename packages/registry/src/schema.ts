export type Framework = "nextjs" | "remix" | "sveltekit" | "nuxt" | "universal";

export interface PatternFile {
  path: string;
  content: string;
}

export interface PatternDependency {
  name: string;
  version?: string;
  dev?: boolean;
}

export type Category =
  | "database"
  | "auth"
  | "environment"
  | "deployment"
  | "api"
  | "testing"
  | "caching"
  | "email"
  | "payments"
  | "monitoring"
  | "infrastructure"
  | "developer-experience";

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

export interface Pattern {
  name: string;
  slug: string;
  description: string;
  category: Category;
  frameworks: Framework[];
  files: Record<Framework, PatternFile[]>;
  dependencies: Record<Framework, PatternDependency[]>;
  devDependencies?: Record<Framework, PatternDependency[]>;
  tier?: PricingTier;
  alternatives?: Alternative[];
  tags?: string[];
  complexity?: Complexity;
}

export interface PatternRegistry {
  patterns: Pattern[];
}
