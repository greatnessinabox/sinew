// Demo configurations for each pattern

import type { PatternDemoConfig } from "./types";

export const inMemoryCacheDemo: PatternDemoConfig = {
  slug: "in-memory-cache",
  category: "caching",
  title: "In-Memory LRU Cache",
  description:
    "Watch the LRU (Least Recently Used) cache in action. See how entries are stored, accessed, and evicted when the cache reaches capacity.",
  requiredServices: [],
  codeFile: "lib/cache.ts",
  actions: [
    {
      id: "set",
      label: "Set Value",
      description: "Store a key-value pair in the cache",
      handler: "cache.set",
      params: [
        {
          name: "key",
          type: "string",
          label: "Key",
          placeholder: "user:123",
          required: true,
        },
        {
          name: "value",
          type: "string",
          label: "Value",
          placeholder: "John Doe",
          required: true,
        },
        {
          name: "ttl",
          type: "number",
          label: "TTL (ms)",
          placeholder: "5000",
          required: false,
        },
      ],
    },
    {
      id: "get",
      label: "Get Value",
      description: "Retrieve a value from the cache",
      handler: "cache.get",
      params: [
        {
          name: "key",
          type: "string",
          label: "Key",
          placeholder: "user:123",
          required: true,
        },
      ],
    },
    {
      id: "delete",
      label: "Delete",
      description: "Remove an entry from the cache",
      handler: "cache.delete",
      variant: "destructive",
      params: [
        {
          name: "key",
          type: "string",
          label: "Key",
          placeholder: "user:123",
          required: true,
        },
      ],
    },
    {
      id: "fill",
      label: "Fill Cache",
      description: "Add multiple entries to trigger LRU eviction",
      handler: "cache.fill",
      variant: "secondary",
    },
    {
      id: "clear",
      label: "Clear All",
      description: "Remove all entries from the cache",
      handler: "cache.clear",
      variant: "destructive",
    },
  ],
  steps: [
    {
      id: "init",
      title: "Cache Initialization",
      description: "Creating an LRU cache with a maximum of 10 entries",
      explanation:
        "The cache uses a JavaScript Map internally. Maps maintain insertion order, making them perfect for LRU eviction - we simply delete the first entry when the cache is full.",
      codeLines: "1-15",
      status: "pending",
    },
    {
      id: "set-check",
      title: "Checking Capacity",
      description: "Before adding, check if the cache is at capacity",
      explanation:
        "When setting a value, we first check if the cache has reached its maximum size. If it has, we need to evict the least recently used entry before adding the new one.",
      codeLines: "17-25",
      status: "pending",
    },
    {
      id: "set-evict",
      title: "LRU Eviction",
      description: "Evict the oldest entry if cache is full",
      explanation:
        "The 'least recently used' entry is the first one in our Map (oldest access time). We get the first key using entries.keys().next() and delete it.",
      codeLines: "27-35",
      status: "pending",
    },
    {
      id: "set-store",
      title: "Storing the Value",
      description: "Add the new entry with metadata",
      explanation:
        "We store the value along with TTL (time-to-live), creation timestamp, and last access time. This metadata helps with expiration and LRU ordering.",
      codeLines: "37-45",
      status: "pending",
    },
    {
      id: "get-lookup",
      title: "Looking Up a Key",
      description: "Retrieve and update access time",
      explanation:
        "When getting a value, we check if it exists and hasn't expired. If valid, we update its position in the Map by deleting and re-inserting it, making it the 'most recently used'.",
      codeLines: "47-65",
      status: "pending",
    },
  ],
  visualizations: [{ type: "cache-state", label: "Cache State" }],
  codeContent: `// lib/cache.ts - In-Memory LRU Cache

interface CacheEntry<T> {
  value: T;
  ttl: number | null;
  createdAt: number;
  accessedAt: number;
}

export class LRUCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, value: T, ttlMs?: number): void {
    // Check capacity before adding
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // Evict the least recently used (first entry)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        console.log(\`[Cache] Evicted: \${oldestKey}\`);
      }
    }

    // Remove existing to update LRU order
    this.cache.delete(key);

    // Store with metadata
    this.cache.set(key, {
      value,
      ttl: ttlMs ?? null,
      createdAt: Date.now(),
      accessedAt: Date.now(),
    });

    console.log(\`[Cache] Set: \${key}\`);
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      console.log(\`[Cache] Miss: \${key}\`);
      return undefined;
    }

    // Check TTL expiration
    if (entry.ttl && Date.now() > entry.createdAt + entry.ttl) {
      this.cache.delete(key);
      console.log(\`[Cache] Expired: \${key}\`);
      return undefined;
    }

    // Update access time (move to end = most recent)
    entry.accessedAt = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);

    console.log(\`[Cache] Hit: \${key}\`);
    return entry.value;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    console.log(\`[Cache] Delete: \${key} (\${deleted ? 'found' : 'not found'})\`);
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(\`[Cache] Cleared \${size} entries\`);
  }

  get size(): number {
    return this.cache.size;
  }
}

// Usage example
const cache = new LRUCache<string>(10);

cache.set("user:1", "Alice");
cache.set("user:2", "Bob", 5000); // 5s TTL

const user = cache.get("user:1"); // Returns "Alice"
`,
};

export const apiValidationDemo: PatternDemoConfig = {
  slug: "validation",
  category: "api",
  title: "API Validation with Zod",
  description:
    "See how Zod validates API requests in real-time. Try submitting valid and invalid data to see the validation errors.",
  requiredServices: [],
  codeFile: "lib/validation.ts",
  actions: [
    {
      id: "validate-user",
      label: "Create User",
      description: "Validate a user creation request",
      handler: "validation.createUser",
      params: [
        {
          name: "name",
          type: "string",
          label: "Name",
          placeholder: "John Doe",
          required: true,
        },
        {
          name: "email",
          type: "string",
          label: "Email",
          placeholder: "john@example.com",
          required: true,
        },
        {
          name: "age",
          type: "number",
          label: "Age",
          placeholder: "25",
          required: false,
        },
      ],
    },
    {
      id: "validate-invalid",
      label: "Submit Invalid",
      description: "Try submitting obviously invalid data",
      handler: "validation.invalid",
      variant: "secondary",
    },
    {
      id: "validate-partial",
      label: "Partial Update",
      description: "Validate a partial update (PATCH)",
      handler: "validation.partial",
      params: [
        {
          name: "name",
          type: "string",
          label: "Name (optional)",
          placeholder: "Jane",
          required: false,
        },
        {
          name: "email",
          type: "string",
          label: "Email (optional)",
          placeholder: "jane@example.com",
          required: false,
        },
      ],
    },
  ],
  steps: [
    {
      id: "define-schema",
      title: "Define Schema",
      description: "Create a Zod schema for your data",
      explanation:
        "Zod schemas are the foundation. They define the shape of your data with TypeScript-like syntax but with runtime validation. Each field specifies its type and constraints.",
      codeLines: "1-15",
      status: "pending",
    },
    {
      id: "parse-input",
      title: "Parse Input",
      description: "Validate incoming data against the schema",
      explanation:
        "The safeParse method attempts to validate data without throwing. It returns a discriminated union: either { success: true, data } or { success: false, error } with detailed error information.",
      codeLines: "17-25",
      status: "pending",
    },
    {
      id: "handle-errors",
      title: "Handle Errors",
      description: "Format validation errors for API response",
      explanation:
        "Zod errors contain rich information: the path to the invalid field, the expected type, and a human-readable message. We transform these into a consistent API error format.",
      codeLines: "27-40",
      status: "pending",
    },
    {
      id: "type-inference",
      title: "Type Inference",
      description: "Get TypeScript types from schemas",
      explanation:
        "One of Zod's superpowers: z.infer extracts the TypeScript type from a schema. This means your runtime validation and compile-time types are always in sync.",
      codeLines: "42-50",
      status: "pending",
    },
  ],
  visualizations: [{ type: "validation-tree", label: "Validation Result" }],
  codeContent: `// lib/validation.ts - API Validation with Zod
import { z } from "zod";

// Define schemas
export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  age: z.number().int().min(0).max(150).optional(),
});

// Infer TypeScript type from schema
export type User = z.infer<typeof userSchema>;

// Validation function with error formatting
export function validateUser(data: unknown): {
  success: boolean;
  data?: User;
  errors?: { path: string; message: string }[];
} {
  const result = userSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors for API response
  const errors = result.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  return { success: false, errors };
}

// Partial schema for PATCH requests
export const userUpdateSchema = userSchema.partial();

// API route example
export async function POST(request: Request) {
  const body = await request.json();
  const validation = validateUser(body);

  if (!validation.success) {
    return Response.json(
      { error: "Validation failed", details: validation.errors },
      { status: 400 }
    );
  }

  // validation.data is fully typed as User
  const user = validation.data;
  // ... save to database
}
`,
};

export const rateLimitingDemo: PatternDemoConfig = {
  slug: "rate-limiting",
  category: "api",
  title: "API Rate Limiting",
  description:
    "Experience rate limiting firsthand. Click the button rapidly to see how the sliding window algorithm blocks excess requests.",
  requiredServices: [],
  codeFile: "lib/rate-limit.ts",
  actions: [
    {
      id: "request",
      label: "Make Request",
      description: "Send a request (counts against limit)",
      handler: "ratelimit.request",
    },
    {
      id: "spam",
      label: "Spam Requests",
      description: "Rapidly send 10 requests",
      handler: "ratelimit.spam",
      variant: "secondary",
    },
    {
      id: "reset",
      label: "Reset Limit",
      description: "Clear the rate limit counter",
      handler: "ratelimit.reset",
      variant: "destructive",
    },
    {
      id: "status",
      label: "Check Status",
      description: "View current rate limit status",
      handler: "ratelimit.status",
    },
  ],
  steps: [
    {
      id: "init-window",
      title: "Initialize Window",
      description: "Set up the sliding window tracker",
      explanation:
        "The sliding window algorithm tracks requests within a time window (e.g., 10 seconds). Unlike fixed windows, it smoothly slides forward, preventing burst attacks at window boundaries.",
      codeLines: "1-12",
      status: "pending",
    },
    {
      id: "check-limit",
      title: "Check Rate Limit",
      description: "Count requests in current window",
      explanation:
        "We filter requests to only those within our window, then compare the count to our limit. If we're at or over the limit, the request is blocked.",
      codeLines: "14-28",
      status: "pending",
    },
    {
      id: "record-request",
      title: "Record Request",
      description: "Log the request timestamp",
      explanation:
        "Each request is recorded with its timestamp. We also track whether it was allowed or blocked for monitoring purposes.",
      codeLines: "30-40",
      status: "pending",
    },
    {
      id: "return-headers",
      title: "Return Headers",
      description: "Send rate limit info in response",
      explanation:
        "Standard headers like X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset inform clients about their quota so they can implement backoff.",
      codeLines: "42-55",
      status: "pending",
    },
  ],
  visualizations: [{ type: "rate-limit", label: "Rate Limit Status" }],
  codeContent: `// lib/rate-limit.ts - Sliding Window Rate Limiter

interface RateLimitConfig {
  limit: number;      // Max requests per window
  windowMs: number;   // Window size in milliseconds
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;      // Timestamp when window resets
}

// In-memory store (use Redis in production)
const requests = new Map<string, number[]>();

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 5, windowMs: 10000 }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get or create request history
  let history = requests.get(identifier) ?? [];

  // Remove requests outside the window
  history = history.filter((timestamp) => timestamp > windowStart);

  // Check if limit exceeded
  const allowed = history.length < config.limit;

  if (allowed) {
    // Record this request
    history.push(now);
    requests.set(identifier, history);
  }

  return {
    allowed,
    limit: config.limit,
    remaining: Math.max(0, config.limit - history.length - (allowed ? 0 : 0)),
    reset: windowStart + config.windowMs,
  };
}

// Middleware example
export function rateLimitMiddleware(config?: RateLimitConfig) {
  return async (request: Request) => {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const result = checkRateLimit(ip, config);

    if (!result.allowed) {
      return new Response("Too Many Requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.reset.toString(),
          "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      });
    }

    // Continue to handler...
  };
}
`,
};

export const errorHandlingDemo: PatternDemoConfig = {
  slug: "error-handling",
  category: "api",
  title: "API Error Handling",
  description:
    "See how custom error classes and error boundaries work together. Trigger different errors to see the consistent error responses.",
  requiredServices: [],
  codeFile: "lib/errors.ts",
  actions: [
    {
      id: "trigger-404",
      label: "Not Found",
      description: "Trigger a 404 NotFoundError",
      handler: "errors.notFound",
      params: [
        {
          name: "resource",
          type: "string",
          label: "Resource",
          placeholder: "User",
          required: false,
        },
      ],
    },
    {
      id: "trigger-401",
      label: "Unauthorized",
      description: "Trigger a 401 UnauthorizedError",
      handler: "errors.unauthorized",
    },
    {
      id: "trigger-403",
      label: "Forbidden",
      description: "Trigger a 403 ForbiddenError",
      handler: "errors.forbidden",
      variant: "secondary",
    },
    {
      id: "trigger-validation",
      label: "Validation Error",
      description: "Trigger a validation error with details",
      handler: "errors.validation",
      variant: "secondary",
    },
    {
      id: "trigger-500",
      label: "Server Error",
      description: "Trigger an unexpected server error",
      handler: "errors.internal",
      variant: "destructive",
    },
    {
      id: "handle-graceful",
      label: "Graceful Handle",
      description: "Show graceful error handling in action",
      handler: "errors.graceful",
    },
  ],
  steps: [
    {
      id: "define-error",
      title: "Define Error Classes",
      description: "Create custom error types that extend Error",
      explanation:
        "Custom error classes allow you to attach metadata like status codes and error codes. They make error handling type-safe and consistent across your API.",
      codeLines: "1-34",
      status: "pending",
    },
    {
      id: "throw-error",
      title: "Throw Typed Error",
      description: "Use custom errors in your handlers",
      explanation:
        "Instead of returning error responses manually, throw typed errors. This separates business logic from error formatting and ensures consistency.",
      codeLines: "35-55",
      status: "pending",
    },
    {
      id: "catch-format",
      title: "Catch & Format",
      description: "Convert errors to API responses",
      explanation:
        "The error handler catches all errors and converts them to consistent JSON responses. Different error types get different status codes.",
      codeLines: "57-85",
      status: "pending",
    },
  ],
  visualizations: [{ type: "error-stack", label: "Error Details" }],
  codeContent: `// lib/errors.ts - Custom Error Classes

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(\`\${resource} not found\`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    public details?: Record<string, string[]>
  ) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

// lib/api/error-handler.ts
export function handleApiError(error: unknown): Response {
  console.error("API Error:", error);

  if (error instanceof AppError) {
    return Response.json(error.toJSON(), {
      status: error.statusCode
    });
  }

  // Handle Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    return Response.json({
      error: "VALIDATION_ERROR",
      message: "Invalid request data",
    }, { status: 400 });
  }

  // Generic error (don't leak internals)
  return Response.json({
    error: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  }, { status: 500 });
}

// Usage in API route
export async function GET(request: Request) {
  try {
    const user = await findUser(id);
    if (!user) throw new NotFoundError("User");
    return Response.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}
`,
};

export const loggingDemo: PatternDemoConfig = {
  slug: "logging",
  category: "monitoring",
  title: "Structured Logging",
  description:
    "Experience structured logging with Pino. Watch logs stream in real-time with different levels and see automatic redaction of sensitive data.",
  requiredServices: [],
  codeFile: "lib/logger/index.ts",
  actions: [
    {
      id: "log-debug",
      label: "Debug",
      description: "Log a debug message",
      handler: "logger.debug",
      params: [
        {
          name: "message",
          type: "string",
          label: "Message",
          placeholder: "Variable state...",
          required: true,
        },
      ],
    },
    {
      id: "log-info",
      label: "Info",
      description: "Log an info message",
      handler: "logger.info",
      params: [
        {
          name: "message",
          type: "string",
          label: "Message",
          placeholder: "User logged in",
          required: true,
        },
      ],
    },
    {
      id: "log-warn",
      label: "Warning",
      description: "Log a warning message",
      handler: "logger.warn",
      variant: "secondary",
      params: [
        {
          name: "message",
          type: "string",
          label: "Message",
          placeholder: "Deprecated API used",
          required: true,
        },
      ],
    },
    {
      id: "log-error",
      label: "Error",
      description: "Log an error message",
      handler: "logger.error",
      variant: "destructive",
      params: [
        {
          name: "message",
          type: "string",
          label: "Message",
          placeholder: "Database connection failed",
          required: true,
        },
      ],
    },
    {
      id: "log-request",
      label: "Simulate Request",
      description: "Log a complete request lifecycle",
      handler: "logger.request",
    },
    {
      id: "log-sensitive",
      label: "Sensitive Data",
      description: "See automatic redaction of passwords/tokens",
      handler: "logger.sensitive",
      variant: "secondary",
    },
  ],
  steps: [
    {
      id: "create-logger",
      title: "Create Logger Instance",
      description: "Configure Pino with options",
      explanation:
        "Pino is configured once with log levels, formatting, and redaction rules. The base bindings add context like service name and environment to every log.",
      codeLines: "1-30",
      status: "pending",
    },
    {
      id: "child-loggers",
      title: "Child Loggers",
      description: "Create context-specific loggers",
      explanation:
        "Child loggers inherit parent config but add additional context. Perfect for request-scoped logging where you want to track request IDs.",
      codeLines: "32-45",
      status: "pending",
    },
    {
      id: "redaction",
      title: "Automatic Redaction",
      description: "Sensitive data is automatically masked",
      explanation:
        "The redact option specifies paths that should be censored. Passwords, tokens, and API keys are replaced with [REDACTED] automatically.",
      codeLines: "47-65",
      status: "pending",
    },
  ],
  visualizations: [{ type: "log-stream", label: "Log Stream" }],
  codeContent: `// lib/logger/index.ts - Structured Logging with Pino
import pino, { Logger, LoggerOptions } from "pino";

const options: LoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV,
    service: "my-app",
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      "password",
      "*.password",
      "token",
      "*.token",
      "authorization",
      "creditCard",
    ],
    censor: "[REDACTED]",
  },
};

export const logger: Logger = pino(options);

// Create child logger with additional context
export function createLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}

// Request-scoped logging
const requestLogger = createLogger({
  requestId: "req_abc123",
  userId: "user_456",
});

requestLogger.info({ path: "/api/users" }, "Request received");
requestLogger.debug({ query: { limit: 10 } }, "Query params");

// Automatic redaction in action
logger.info({
  user: "john@example.com",
  password: "secret123",      // → "[REDACTED]"
  token: "eyJhbG...",         // → "[REDACTED]"
}, "User login attempt");

// Structured error logging
try {
  await riskyOperation();
} catch (error) {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  }, "Operation failed");
}
`,
};

export const typeSafeEnvDemo: PatternDemoConfig = {
  slug: "type-safe-env",
  category: "environment",
  title: "Type-safe Environment Variables",
  description:
    "See how Zod validates environment variables at startup. Invalid or missing variables are caught immediately, not in production.",
  requiredServices: [],
  codeFile: "lib/env/server.ts",
  actions: [
    {
      id: "validate-complete",
      label: "Validate All",
      description: "Validate a complete valid env configuration",
      handler: "env.validateComplete",
    },
    {
      id: "validate-missing",
      label: "Missing Required",
      description: "See what happens with missing required vars",
      handler: "env.validateMissing",
      variant: "secondary",
    },
    {
      id: "validate-invalid",
      label: "Invalid Values",
      description: "Validate with invalid value types",
      handler: "env.validateInvalid",
      variant: "destructive",
    },
    {
      id: "check-single",
      label: "Check Variable",
      description: "Check a specific environment variable",
      handler: "env.checkSingle",
      params: [
        {
          name: "key",
          type: "string",
          label: "Variable Name",
          placeholder: "DATABASE_URL",
          required: true,
        },
        {
          name: "value",
          type: "string",
          label: "Value",
          placeholder: "postgresql://...",
          required: true,
        },
      ],
    },
  ],
  steps: [
    {
      id: "define-schema",
      title: "Define Schema",
      description: "Create a Zod schema for your env vars",
      explanation:
        "Each variable gets a type and validation rules. Use .url() for URLs, .min() for secrets, .optional() for non-critical vars.",
      codeLines: "1-15",
      status: "pending",
    },
    {
      id: "parse-validate",
      title: "Parse & Validate",
      description: "Validate process.env at startup",
      explanation:
        "safeParse returns either success with typed data, or an error with details. This runs when your app starts, catching issues immediately.",
      codeLines: "17-28",
      status: "pending",
    },
    {
      id: "fail-fast",
      title: "Fail Fast",
      description: "Throw on invalid configuration",
      explanation:
        "If validation fails, we throw with detailed errors. This prevents the app from starting with invalid config.",
      codeLines: "30-40",
      status: "pending",
    },
    {
      id: "type-safe-access",
      title: "Type-safe Access",
      description: "Access env vars with full TypeScript support",
      explanation:
        "The exported env object is fully typed. TypeScript knows exactly what variables exist and their types.",
      codeLines: "42-50",
      status: "pending",
    },
  ],
  visualizations: [{ type: "env-validation", label: "Environment Status" }],
  codeContent: `// lib/env/server.ts - Type-safe Environment Variables
import { z } from "zod";

const serverEnvSchema = z.object({
  // Required
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),

  // Optional with defaults
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Optional OAuth
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

// Now you get full type safety!
// env.DATABASE_URL  → string (guaranteed)
// env.PORT          → number (coerced & defaulted)
// env.GITHUB_CLIENT_ID → string | undefined

// Client-side env (NEXT_PUBLIC_ prefix)
// lib/env/client.ts
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default("My App"),
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});
`,
};

export const sessionsDemo: PatternDemoConfig = {
  slug: "sessions",
  category: "auth",
  title: "Session Management",
  description:
    "Manage user sessions with device tracking and automatic expiration. See active sessions across devices and revoke access.",
  requiredServices: [],
  codeFile: "lib/session.ts",
  actions: [
    {
      id: "create-session",
      label: "Create Session",
      description: "Create a new session (simulates login)",
      handler: "sessions.create",
      params: [
        {
          name: "device",
          type: "string",
          label: "Device",
          placeholder: "MacBook Pro",
          required: false,
        },
      ],
    },
    {
      id: "list-sessions",
      label: "List Sessions",
      description: "View all active sessions for the user",
      handler: "sessions.list",
    },
    {
      id: "revoke-session",
      label: "Revoke Session",
      description: "Revoke a specific session",
      handler: "sessions.revoke",
      variant: "destructive",
      params: [
        {
          name: "sessionId",
          type: "string",
          label: "Session ID",
          placeholder: "sess_...",
          required: true,
        },
      ],
    },
    {
      id: "revoke-all",
      label: "Revoke All",
      description: "Log out from all devices",
      handler: "sessions.revokeAll",
      variant: "destructive",
    },
    {
      id: "refresh-session",
      label: "Refresh",
      description: "Extend the current session",
      handler: "sessions.refresh",
    },
  ],
  steps: [
    {
      id: "create",
      title: "Create Session",
      description: "Generate session ID and store in database",
      explanation:
        "Sessions are stored in the database with a unique ID, user reference, expiration time, and device info. A secure cookie links the browser to the session.",
      codeLines: "1-25",
      status: "pending",
    },
    {
      id: "validate",
      title: "Validate Session",
      description: "Check session on each request",
      explanation:
        "On each request, we look up the session by cookie, check if it exists and hasn't expired. Invalid sessions are cleaned up automatically.",
      codeLines: "27-45",
      status: "pending",
    },
    {
      id: "track-devices",
      title: "Track Devices",
      description: "Store device info for security",
      explanation:
        "User agent and IP address help users identify where they're logged in. This is essential for security - users can spot unauthorized access.",
      codeLines: "47-65",
      status: "pending",
    },
    {
      id: "revoke",
      title: "Revoke Sessions",
      description: "Allow users to log out everywhere",
      explanation:
        "Users can revoke individual sessions or all sessions at once. This is crucial for security when devices are lost or compromised.",
      codeLines: "67-85",
      status: "pending",
    },
  ],
  visualizations: [{ type: "session-list", label: "Active Sessions" }],
  codeContent: `// lib/session.ts - Secure Session Management
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

const SESSION_COOKIE = "session_id";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export async function createSession(
  userId: string,
  options?: { userAgent?: string; ipAddress?: string }
): Promise<Session> {
  const sessionId = nanoid(32);
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const session = await db.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt,
      ...options,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  });

  return session;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await db.session.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

export async function getUserSessions(userId: string) {
  return db.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeSession(sessionId: string) {
  await db.session.delete({ where: { id: sessionId } });
}

export async function revokeAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}
`,
};

export const featureFlagsDemo: PatternDemoConfig = {
  slug: "feature-flags",
  category: "developer-experience",
  title: "Feature Flags with Rollouts",
  description:
    "Control feature rollouts with gradual percentage-based releases and user targeting. See how flags evaluate in real-time based on user context.",
  requiredServices: [],
  codeFile: "lib/flags/config.ts",
  actions: [
    {
      id: "check-flag",
      label: "Check Flag",
      description: "Evaluate if a feature is enabled for the current user",
      handler: "flags.check",
      params: [
        {
          name: "flagKey",
          type: "string",
          label: "Flag Key",
          placeholder: "new-dashboard",
          required: true,
        },
      ],
    },
    {
      id: "check-as-user",
      label: "Check as User",
      description: "Check flag for a specific user ID",
      handler: "flags.checkAsUser",
      params: [
        {
          name: "flagKey",
          type: "string",
          label: "Flag Key",
          placeholder: "ai-assistant",
          required: true,
        },
        {
          name: "userId",
          type: "string",
          label: "User ID",
          placeholder: "user_beta1",
          required: true,
        },
      ],
    },
    {
      id: "toggle-flag",
      label: "Toggle Flag",
      description: "Enable or disable a feature flag",
      handler: "flags.toggle",
      variant: "secondary",
      params: [
        {
          name: "flagKey",
          type: "string",
          label: "Flag Key",
          placeholder: "beta-api",
          required: true,
        },
      ],
    },
    {
      id: "set-rollout",
      label: "Set Rollout %",
      description: "Adjust the gradual rollout percentage",
      handler: "flags.setRollout",
      params: [
        {
          name: "flagKey",
          type: "string",
          label: "Flag Key",
          placeholder: "new-dashboard",
          required: true,
        },
        {
          name: "percentage",
          type: "number",
          label: "Percentage",
          placeholder: "50",
          required: true,
        },
      ],
    },
    {
      id: "target-user",
      label: "Target User",
      description: "Add a user to the targeted list",
      handler: "flags.targetUser",
      variant: "secondary",
      params: [
        {
          name: "flagKey",
          type: "string",
          label: "Flag Key",
          placeholder: "ai-assistant",
          required: true,
        },
        {
          name: "userId",
          type: "string",
          label: "User ID",
          placeholder: "user_vip",
          required: true,
        },
      ],
    },
    {
      id: "switch-user",
      label: "Switch User",
      description: "Change the current user context",
      handler: "flags.switchUser",
      params: [
        {
          name: "userId",
          type: "string",
          label: "User ID",
          placeholder: "user_new",
          required: true,
        },
      ],
    },
  ],
  steps: [
    {
      id: "define-flags",
      title: "Define Flags",
      description: "Configure feature flags with metadata",
      explanation:
        "Each flag has a key, name, description, and configuration. Flags can be simple on/off toggles or have percentage-based rollouts and user targeting.",
      codeLines: "1-20",
      status: "pending",
    },
    {
      id: "check-enabled",
      title: "Check If Enabled",
      description: "Evaluate a flag for a specific user",
      explanation:
        "The isEnabled function checks: (1) if the flag exists and is enabled, (2) if the user is in the targeted list, (3) if the user falls within the rollout percentage using a deterministic hash.",
      codeLines: "22-45",
      status: "pending",
    },
    {
      id: "rollout-logic",
      title: "Percentage Rollout",
      description: "Gradual rollout using deterministic hashing",
      explanation:
        "We hash the user ID + flag key to get a consistent 0-99 value. If this value is less than the rollout percentage, the user gets the feature. This ensures users don't flip-flop between enabled/disabled.",
      codeLines: "47-60",
      status: "pending",
    },
    {
      id: "use-in-code",
      title: "Use in Components",
      description: "Conditionally render features",
      explanation:
        "In React components, use the flag hook or provider to conditionally render features. The flag state is evaluated once and cached for the session.",
      codeLines: "62-80",
      status: "pending",
    },
  ],
  visualizations: [{ type: "flag-state", label: "Flag State" }],
  codeContent: `// lib/flags/config.ts - Feature Flags with Rollouts
import { get } from "@vercel/edge-config";

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;  // 0-100
  targetedUsers: string[];    // Always enabled for these users
}

// Hash user ID for deterministic rollout
function hashToPercentage(userId: string, flagKey: string): number {
  let hash = 0;
  const str = \`\${userId}:\${flagKey}\`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 100;
}

export async function isFeatureEnabled(
  flagKey: string,
  userId: string
): Promise<boolean> {
  // Fetch flag config from Edge Config (or Redis/database)
  const flag = await get<FeatureFlag>(flagKey);

  if (!flag || !flag.enabled) {
    return false;
  }

  // Check if user is explicitly targeted
  if (flag.targetedUsers.includes(userId)) {
    return true;
  }

  // Check rollout percentage
  const userPercentage = hashToPercentage(userId, flagKey);
  return userPercentage < flag.rolloutPercentage;
}

// lib/flags/provider.tsx - React Provider
"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface FlagContextValue {
  flags: Record<string, boolean>;
  isLoading: boolean;
}

const FlagContext = createContext<FlagContextValue>({
  flags: {},
  isLoading: true,
});

export function FlagProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(\`/api/flags?userId=\${userId}\`)
      .then((res) => res.json())
      .then((data) => {
        setFlags(data.flags);
        setIsLoading(false);
      });
  }, [userId]);

  return (
    <FlagContext.Provider value={{ flags, isLoading }}>
      {children}
    </FlagContext.Provider>
  );
}

export function useFlag(flagKey: string): boolean {
  const { flags } = useContext(FlagContext);
  return flags[flagKey] ?? false;
}

// components/feature-gate.tsx
export function FeatureGate({
  flag,
  children,
  fallback = null,
}: {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const enabled = useFlag(flag);
  return enabled ? <>{children}</> : <>{fallback}</>;
}

// Usage in components
function Dashboard() {
  return (
    <FeatureGate flag="new-dashboard" fallback={<LegacyDashboard />}>
      <NewDashboard />
    </FeatureGate>
  );
}
`,
};

// Pattern demo registry
export const demoConfigs: Record<string, PatternDemoConfig> = {
  "caching/in-memory-cache": inMemoryCacheDemo,
  "api/validation": apiValidationDemo,
  "api/rate-limiting": rateLimitingDemo,
  "api/error-handling": errorHandlingDemo,
  "monitoring/logging": loggingDemo,
  "environment/type-safe-env": typeSafeEnvDemo,
  "auth/sessions": sessionsDemo,
  "developer-experience/feature-flags": featureFlagsDemo,
};

export function getDemoConfig(category: string, slug: string): PatternDemoConfig | undefined {
  return demoConfigs[`${category}/${slug}`];
}

export function getAllDemoConfigs(): PatternDemoConfig[] {
  return Object.values(demoConfigs);
}
