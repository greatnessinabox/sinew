import type { Pattern } from "../../schema.js";

export const logging: Pattern = {
  name: "Structured Logging",
  slug: "logging",
  description:
    "Structured JSON logging with Pino. Fast, low-overhead logging with log levels and context.",
  category: "monitoring",
  tier: "free",
  complexity: "beginner",
  tags: ["logging", "pino", "observability", "json"],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/logger/index.ts",
        content: `import pino, { Logger, LoggerOptions } from "pino";

const isProduction = process.env.NODE_ENV === "production";
const isServer = typeof window === "undefined";

const baseOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV,
    service: process.env.SERVICE_NAME || "nextjs-app",
    version: process.env.npm_package_version,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      "password",
      "*.password",
      "secret",
      "*.secret",
      "token",
      "*.token",
      "authorization",
      "*.authorization",
      "cookie",
      "*.cookie",
      "creditCard",
      "*.creditCard",
      "ssn",
      "*.ssn",
    ],
    censor: "[REDACTED]",
  },
};

// Server-side logger configuration
const serverOptions: LoggerOptions = {
  ...baseOptions,
  transport: !isProduction
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
};

// Browser-side logger configuration (minimal)
const browserOptions: LoggerOptions = {
  ...baseOptions,
  browser: {
    asObject: true,
    write: {
      debug: (o) => console.debug(o),
      info: (o) => console.info(o),
      warn: (o) => console.warn(o),
      error: (o) => console.error(o),
      fatal: (o) => console.error(o),
    },
  },
};

/**
 * Main application logger instance
 */
export const logger: Logger = pino(isServer ? serverOptions : browserOptions);

/**
 * Create a child logger with additional context
 */
export function createLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}

/**
 * Log levels for reference
 */
export const LogLevel = {
  TRACE: "trace",
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  FATAL: "fatal",
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];
`,
      },
      {
        path: "lib/logger/context.ts",
        content: `import { AsyncLocalStorage } from "async_hooks";
import { createLogger, logger } from "./index.js";
import type { Logger } from "pino";

interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: unknown;
}

const contextStorage = new AsyncLocalStorage<LogContext>();

/**
 * Run a function with logging context
 */
export function withLogContext<T>(context: LogContext, fn: () => T): T {
  const parentContext = contextStorage.getStore() || {};
  return contextStorage.run({ ...parentContext, ...context }, fn);
}

/**
 * Run an async function with logging context
 */
export async function withLogContextAsync<T>(
  context: LogContext,
  fn: () => Promise<T>
): Promise<T> {
  const parentContext = contextStorage.getStore() || {};
  return contextStorage.run({ ...parentContext, ...context }, fn);
}

/**
 * Get the current logging context
 */
export function getLogContext(): LogContext | undefined {
  return contextStorage.getStore();
}

/**
 * Add to the current logging context
 */
export function addLogContext(context: LogContext): void {
  const current = contextStorage.getStore();
  if (current) {
    Object.assign(current, context);
  }
}

/**
 * Get a logger with the current context attached
 */
export function getContextLogger(): Logger {
  const context = getLogContext();
  if (context) {
    return createLogger(context);
  }
  return logger;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return \`req_\${Date.now().toString(36)}_\${Math.random().toString(36).substring(2, 11)}\`;
}
`,
      },
      {
        path: "lib/logger/middleware.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { logger, createLogger } from "./index.js";

interface RequestLogData {
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  userAgent: string | null;
  ip: string | null;
  referer: string | null;
}

interface ResponseLogData {
  status: number;
  duration: number;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return \`req_\${Date.now().toString(36)}_\${Math.random().toString(36).substring(2, 11)}\`;
}

/**
 * Extract request data for logging
 */
function extractRequestData(request: NextRequest): RequestLogData {
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    method: request.method,
    url: request.url,
    path: url.pathname,
    query,
    userAgent: request.headers.get("user-agent"),
    ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    referer: request.headers.get("referer"),
  };
}

/**
 * Request logging middleware for Next.js
 */
export function withRequestLogging(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = performance.now();
    const requestId = generateRequestId();
    const requestData = extractRequestData(request);

    const requestLogger = createLogger({
      requestId,
      method: requestData.method,
      path: requestData.path,
    });

    // Log incoming request
    requestLogger.info({ request: requestData }, "Incoming request");

    try {
      const response = await handler(request);
      const duration = Math.round(performance.now() - startTime);

      // Add request ID to response headers
      response.headers.set("x-request-id", requestId);

      // Log response
      const responseData: ResponseLogData = {
        status: response.status,
        duration,
      };

      if (response.status >= 400) {
        requestLogger.warn({ response: responseData }, "Request completed with error");
      } else {
        requestLogger.info({ response: responseData }, "Request completed");
      }

      return response;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      requestLogger.error(
        {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : error,
          duration,
        },
        "Request failed"
      );

      throw error;
    }
  };
}

/**
 * Create a request-scoped logger for API routes
 */
export function createRequestLogger(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || generateRequestId();
  const url = new URL(request.url);

  return createLogger({
    requestId,
    method: request.method,
    path: url.pathname,
  });
}

/**
 * Log API errors consistently
 */
export function logApiError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const errorData = error instanceof Error
    ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    : { error };

  logger.error({ ...errorData, ...context }, "API error occurred");
}
`,
      },
      {
        path: "lib/logger/server-actions.ts",
        content: `import { createLogger, logger } from "./index.js";
import type { Logger } from "pino";

interface ActionContext {
  actionName: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Wrap a server action with logging
 */
export function withActionLogging<TArgs extends unknown[], TResult>(
  actionName: string,
  action: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const startTime = performance.now();
    const actionLogger = createLogger({ action: actionName });

    actionLogger.debug({ args: sanitizeArgs(args) }, "Server action started");

    try {
      const result = await action(...args);
      const duration = Math.round(performance.now() - startTime);

      actionLogger.info({ duration }, "Server action completed");

      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      actionLogger.error(
        {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : error,
          duration,
        },
        "Server action failed"
      );

      throw error;
    }
  };
}

/**
 * Create a logger for a specific server action
 */
export function createActionLogger(context: ActionContext): Logger {
  return createLogger({
    action: context.actionName,
    ...context,
  });
}

/**
 * Sanitize arguments for logging (remove sensitive data)
 */
function sanitizeArgs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (typeof arg === "object" && arg !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(arg)) {
        if (isSensitiveKey(key)) {
          sanitized[key] = "[REDACTED]";
        } else if (typeof value === "object" && value !== null) {
          sanitized[key] = "[Object]";
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }
    return arg;
  });
}

/**
 * Check if a key is sensitive and should be redacted
 */
function isSensitiveKey(key: string): boolean {
  const sensitivePatterns = [
    "password",
    "secret",
    "token",
    "key",
    "auth",
    "credential",
    "credit",
    "ssn",
    "social",
  ];
  const lowerKey = key.toLowerCase();
  return sensitivePatterns.some((pattern) => lowerKey.includes(pattern));
}

/**
 * Log slow server actions
 */
export function logSlowAction(
  actionName: string,
  duration: number,
  threshold: number = 1000
): void {
  if (duration > threshold) {
    logger.warn(
      {
        action: actionName,
        duration,
        threshold,
      },
      "Slow server action detected"
    );
  }
}
`,
      },
      {
        path: ".env.example",
        content: `# Logging Configuration

# Log level: trace, debug, info, warn, error, fatal
LOG_LEVEL="info"

# Service name for log identification
SERVICE_NAME="my-nextjs-app"

# Enable pretty printing in development (handled automatically)
# Set to "true" to force pretty printing in production (not recommended)
LOG_PRETTY="false"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "pino" }, { name: "pino-pretty", dev: true }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
