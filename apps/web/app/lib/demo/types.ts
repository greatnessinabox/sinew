// Demo playground types

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  source: string;
  step?: string;
}

export interface ExecutionStep {
  id: string;
  title: string;
  description: string;
  explanation: string;
  codeLines?: string; // e.g., "27-41" for highlighting
  status: "pending" | "running" | "completed" | "error";
  output?: unknown;
  duration?: number;
}

export interface DemoAction {
  id: string;
  label: string;
  description: string;
  handler: string;
  variant?: "default" | "destructive" | "secondary";
  params?: ParamDefinition[];
}

export interface ParamDefinition {
  name: string;
  type: "string" | "number" | "boolean" | "json";
  label?: string;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  required?: boolean;
}

export type VisualizationType =
  | "cache-state"
  | "rate-limit"
  | "validation-tree"
  | "request-flow"
  | "log-stream"
  | "error-stack"
  | "env-validation"
  | "session-list";

export interface Visualization {
  type: VisualizationType;
  label: string;
}

export interface PatternDemoConfig {
  slug: string;
  category: string;
  title: string;
  description: string;
  requiredServices: string[];
  actions: DemoAction[];
  steps: ExecutionStep[];
  visualizations: Visualization[];
  codeFile: string;
  codeContent?: string;
}

export interface ExecuteRequest {
  category: string;
  slug: string;
  action: string;
  params?: Record<string, unknown>;
  sessionId: string;
}

export interface ExecuteResponse {
  success: boolean;
  result?: unknown;
  logs: LogEntry[];
  steps: ExecutionStep[];
  duration: number;
  error?: string;
  visualizationData?: unknown;
}

// Cache-specific types
export interface CacheEntry {
  key: string;
  value: unknown;
  ttl: number | null;
  createdAt: number;
  accessedAt: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export interface CacheVisualizationData {
  entries: CacheEntry[];
  stats: CacheStats;
  lastAction?: {
    type: "get" | "set" | "delete" | "evict" | "clear";
    key: string;
    hit?: boolean;
  };
}

// Rate limit types
export interface RateLimitData {
  limit: number;
  remaining: number;
  reset: number;
  blocked: boolean;
  requests: { timestamp: number; allowed: boolean }[];
}

// Validation types
export interface ValidationResult {
  success: boolean;
  data?: unknown;
  errors?: ValidationError[];
}

export interface ValidationError {
  path: string[];
  message: string;
  code: string;
}

// Error handling types
export interface ErrorVisualizationData {
  errorType: string;
  statusCode: number;
  message: string;
  stack?: string[];
  code: string;
  timestamp: number;
  handled: boolean;
}

// Logging types
export interface LogStreamData {
  entries: LogEntry[];
  levels: { debug: number; info: number; warn: number; error: number };
  filter: LogLevel | "all";
}

// Environment types
export interface EnvValidationData {
  variables: EnvVariable[];
  valid: boolean;
  missingRequired: string[];
  invalidValues: { key: string; expected: string; received: string }[];
}

export interface EnvVariable {
  key: string;
  value: string | undefined;
  required: boolean;
  type: "string" | "number" | "url" | "boolean" | "enum";
  valid: boolean;
  error?: string;
  isSecret: boolean;
}

// Session types
export interface SessionVisualizationData {
  sessions: SessionEntry[];
  currentSessionId: string | null;
  stats: { total: number; active: number; expired: number };
}

export interface SessionEntry {
  id: string;
  userId: string;
  device: string;
  browser: string;
  ip: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  isCurrent: boolean;
}
