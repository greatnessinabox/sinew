import { NextResponse } from "next/server";
import type {
  ExecuteRequest,
  ExecuteResponse,
  LogEntry,
  ExecutionStep,
  CacheVisualizationData,
  RateLimitData,
  ErrorVisualizationData,
  EnvValidationData,
  SessionVisualizationData,
  LogStreamData,
  FeatureFlagsVisualizationData,
} from "@/app/lib/demo/types";
import {
  sandboxCache,
  sandboxRateLimit,
  touchSession,
  sandboxSessions,
  sandboxEnv,
  sandboxFeatureFlags,
} from "@/app/lib/demo/sandbox-services";
import { getDemoConfig } from "@/app/lib/demo/pattern-configs";

// Simple in-memory rate limiter for demo endpoint
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Clean up expired entries periodically to prevent memory leaks
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) rateLimitMap.delete(key);
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_LIMIT_WINDOW };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count, resetIn: record.resetTime - now };
}

export async function POST(request: Request) {
  // Rate limit by IP or session
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000)),
          "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
        },
      }
    );
  }

  try {
    const body = (await request.json()) as ExecuteRequest;
    const { category, slug, action, params, sessionId } = body;

    // Validate request
    if (!category || !slug || !action || !sessionId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get demo config
    const demo = getDemoConfig(category, slug);
    if (!demo) {
      return NextResponse.json({ success: false, error: "Demo not found" }, { status: 404 });
    }

    // Touch session to keep it alive
    touchSession(sessionId);

    // Execute action based on pattern
    const result = await executePatternAction(
      category,
      slug,
      action,
      params ?? {},
      sessionId,
      demo.steps
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Demo execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function executePatternAction(
  category: string,
  slug: string,
  action: string,
  params: Record<string, unknown>,
  sessionId: string,
  demoSteps: ExecutionStep[]
): Promise<ExecuteResponse> {
  const startTime = Date.now();
  const logs: LogEntry[] = [];

  const addLog = (
    level: LogEntry["level"],
    message: string,
    data?: Record<string, unknown>,
    source = "demo"
  ) => {
    logs.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      data,
      source,
    });
  };

  // Route to appropriate handler
  if (category === "caching" && slug === "in-memory-cache") {
    return executeCacheAction(action, params, sessionId, demoSteps, logs, addLog, startTime);
  }

  if (category === "api" && slug === "rate-limiting") {
    return executeRateLimitAction(action, params, sessionId, demoSteps, logs, addLog, startTime);
  }

  if (category === "api" && slug === "validation") {
    return executeValidationAction(action, params, sessionId, demoSteps, logs, addLog, startTime);
  }

  if (category === "api" && slug === "error-handling") {
    return executeErrorHandlingAction(
      action,
      params,
      sessionId,
      demoSteps,
      logs,
      addLog,
      startTime
    );
  }

  if (category === "monitoring" && slug === "logging") {
    return executeLoggingAction(action, params, sessionId, demoSteps, logs, addLog, startTime);
  }

  if (category === "environment" && slug === "type-safe-env") {
    return executeEnvAction(action, params, sessionId, demoSteps, logs, addLog, startTime);
  }

  if (category === "auth" && slug === "sessions") {
    return executeSessionsAction(action, params, sessionId, demoSteps, logs, addLog, startTime);
  }

  if (category === "developer-experience" && slug === "feature-flags") {
    return executeFeatureFlagsAction(action, params, sessionId, demoSteps, logs, addLog, startTime);
  }

  return {
    success: false,
    error: `Unknown pattern: ${category}/${slug}`,
    logs,
    steps: [],
    duration: Date.now() - startTime,
  };
}

// Cache demo actions
function executeCacheAction(
  action: string,
  params: Record<string, unknown>,
  sessionId: string,
  demoSteps: ExecutionStep[],
  logs: LogEntry[],
  addLog: (
    level: LogEntry["level"],
    message: string,
    data?: Record<string, unknown>,
    source?: string
  ) => void,
  startTime: number
): ExecuteResponse {
  let result: unknown;
  let lastAction: CacheVisualizationData["lastAction"];

  switch (action) {
    case "set": {
      const key = String(params.key ?? "");
      const value = params.value;
      const ttl = params.ttl ? Number(params.ttl) : undefined;

      if (!key) {
        return {
          success: false,
          error: "Key is required",
          logs,
          steps: [],
          duration: Date.now() - startTime,
        };
      }

      addLog("info", `Setting cache key: ${key}`, { value, ttl }, "cache");
      const { evicted } = sandboxCache.set(sessionId, key, value, ttl);

      if (evicted) {
        addLog("warn", `LRU eviction: removed key "${evicted}"`, undefined, "cache");
      }

      addLog("info", `Successfully set key: ${key}`, undefined, "cache");
      result = { key, value, evicted };
      lastAction = { type: "set", key };
      break;
    }

    case "get": {
      const key = String(params.key ?? "");

      if (!key) {
        return {
          success: false,
          error: "Key is required",
          logs,
          steps: [],
          duration: Date.now() - startTime,
        };
      }

      addLog("info", `Getting cache key: ${key}`, undefined, "cache");
      const { value, hit } = sandboxCache.get(sessionId, key);

      if (hit) {
        addLog("info", `Cache HIT for key: ${key}`, { value }, "cache");
      } else {
        addLog("warn", `Cache MISS for key: ${key}`, undefined, "cache");
      }

      result = { key, value, hit };
      lastAction = { type: "get", key, hit };
      break;
    }

    case "delete": {
      const key = String(params.key ?? "");

      if (!key) {
        return {
          success: false,
          error: "Key is required",
          logs,
          steps: [],
          duration: Date.now() - startTime,
        };
      }

      addLog("info", `Deleting cache key: ${key}`, undefined, "cache");
      const deleted = sandboxCache.delete(sessionId, key);
      addLog("info", deleted ? `Deleted key: ${key}` : `Key not found: ${key}`, undefined, "cache");

      result = { key, deleted };
      lastAction = { type: "delete", key };
      break;
    }

    case "fill": {
      addLog("info", "Filling cache to trigger LRU eviction...", undefined, "cache");

      for (let i = 1; i <= 12; i++) {
        const key = `item:${i}`;
        const { evicted } = sandboxCache.set(sessionId, key, { id: i, name: `Item ${i}` });
        addLog("debug", `Set ${key}`, evicted ? { evicted } : undefined, "cache");

        if (evicted) {
          addLog("warn", `Evicted: ${evicted}`, undefined, "cache");
        }
      }

      addLog("info", "Cache filled with 12 items (max 10, so 2 evictions)", undefined, "cache");
      result = { filled: 12 };
      lastAction = { type: "set", key: "item:12" };
      break;
    }

    case "clear": {
      addLog("info", "Clearing all cache entries...", undefined, "cache");
      const count = sandboxCache.clear(sessionId);
      addLog("info", `Cleared ${count} entries`, undefined, "cache");

      result = { cleared: count };
      lastAction = { type: "clear", key: "*" };
      break;
    }

    default:
      return {
        success: false,
        error: `Unknown action: ${action}`,
        logs,
        steps: [],
        duration: Date.now() - startTime,
      };
  }

  const entries = sandboxCache.getEntries(sessionId);
  const stats = sandboxCache.getStats(sessionId);

  const visualizationData: CacheVisualizationData = {
    entries,
    stats,
    lastAction,
  };

  return {
    success: true,
    result,
    logs,
    steps: demoSteps.map((s, i) => ({ ...s, status: i < 3 ? "completed" : ("pending" as const) })),
    duration: Date.now() - startTime,
    visualizationData,
  };
}

// Rate limit demo actions
function executeRateLimitAction(
  action: string,
  params: Record<string, unknown>,
  sessionId: string,
  demoSteps: ExecutionStep[],
  logs: LogEntry[],
  addLog: (
    level: LogEntry["level"],
    message: string,
    data?: Record<string, unknown>,
    source?: string
  ) => void,
  startTime: number
): ExecuteResponse {
  let result: unknown;

  switch (action) {
    case "request": {
      addLog("info", "Checking rate limit...", undefined, "ratelimit");
      const data = sandboxRateLimit.check(sessionId);

      if (data.blocked) {
        addLog("error", "Request BLOCKED - rate limit exceeded", { remaining: 0 }, "ratelimit");
      } else {
        addLog("info", `Request allowed (${data.remaining} remaining)`, undefined, "ratelimit");
      }

      result = data;
      return {
        success: true,
        result,
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 3 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData: data,
      };
    }

    case "spam": {
      addLog("info", "Sending 10 rapid requests...", undefined, "ratelimit");
      let lastData: RateLimitData | null = null;

      for (let i = 1; i <= 10; i++) {
        const data = sandboxRateLimit.check(sessionId);
        lastData = data;

        if (data.blocked) {
          addLog("error", `Request ${i}: BLOCKED`, undefined, "ratelimit");
        } else {
          addLog(
            "info",
            `Request ${i}: Allowed (${data.remaining} remaining)`,
            undefined,
            "ratelimit"
          );
        }
      }

      result = lastData;
      return {
        success: true,
        result,
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 3 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData: lastData,
      };
    }

    case "reset": {
      addLog("info", "Resetting rate limit...", undefined, "ratelimit");
      sandboxRateLimit.reset(sessionId);
      const data = sandboxRateLimit.getStatus(sessionId);
      addLog("info", "Rate limit reset", { remaining: data.remaining }, "ratelimit");

      result = data;
      return {
        success: true,
        result,
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 3 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData: data,
      };
    }

    case "status": {
      const data = sandboxRateLimit.getStatus(sessionId);
      addLog(
        "info",
        "Current rate limit status",
        {
          limit: data.limit,
          remaining: data.remaining,
          blocked: data.blocked,
        },
        "ratelimit"
      );

      result = data;
      return {
        success: true,
        result,
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 3 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData: data,
      };
    }

    default:
      return {
        success: false,
        error: `Unknown action: ${action}`,
        logs,
        steps: [],
        duration: Date.now() - startTime,
      };
  }
}

// Validation demo actions
function executeValidationAction(
  action: string,
  params: Record<string, unknown>,
  sessionId: string,
  demoSteps: ExecutionStep[],
  logs: LogEntry[],
  addLog: (
    level: LogEntry["level"],
    message: string,
    data?: Record<string, unknown>,
    source?: string
  ) => void,
  startTime: number
): ExecuteResponse {
  switch (action) {
    case "validate-user": {
      addLog("info", "Validating user data...", params, "zod");

      const errors: { path: string[]; message: string; code: string }[] = [];

      // Name validation
      const name = String(params.name ?? "");
      if (!name) {
        errors.push({ path: ["name"], message: "Required", code: "invalid_type" });
      } else if (name.length < 2) {
        errors.push({
          path: ["name"],
          message: "Name must be at least 2 characters",
          code: "too_small",
        });
      }

      // Email validation
      const email = String(params.email ?? "");
      if (!email) {
        errors.push({ path: ["email"], message: "Required", code: "invalid_type" });
      } else if (!email.includes("@") || !email.includes(".")) {
        errors.push({ path: ["email"], message: "Invalid email address", code: "invalid_string" });
      }

      // Age validation
      const age = params.age ? Number(params.age) : undefined;
      if (age !== undefined) {
        if (!Number.isInteger(age)) {
          errors.push({
            path: ["age"],
            message: "Expected integer, received float",
            code: "invalid_type",
          });
        } else if (age < 0 || age > 150) {
          errors.push({
            path: ["age"],
            message: "Age must be between 0 and 150",
            code: "too_small",
          });
        }
      }

      const visualizationData = {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        data: errors.length === 0 ? { name, email, age } : undefined,
        inputData: params,
      };

      if (errors.length > 0) {
        errors.forEach((e) => {
          addLog("error", `${e.path.join(".")}: ${e.message}`, { code: e.code }, "zod");
        });
      } else {
        addLog("info", "✓ Validation passed", { data: { name, email, age } }, "zod");
      }

      return {
        success: true,
        result: visualizationData,
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < (errors.length > 0 ? 3 : 4) ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData,
      };
    }

    case "validate-invalid": {
      addLog("info", "Submitting intentionally invalid data...", undefined, "zod");

      const invalidData = { name: "A", email: "not-an-email", age: -5 };
      addLog("debug", "Input data", invalidData, "zod");

      const errors = [
        { path: ["name"], message: "Name must be at least 2 characters", code: "too_small" },
        { path: ["email"], message: "Invalid email address", code: "invalid_string" },
        { path: ["age"], message: "Number must be greater than or equal to 0", code: "too_small" },
      ];

      errors.forEach((e) => {
        addLog("error", `${e.path.join(".")}: ${e.message}`, { code: e.code }, "zod");
      });

      const visualizationData = {
        success: false,
        errors,
        inputData: invalidData,
      };

      return {
        success: true,
        result: visualizationData,
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 3 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData,
      };
    }

    case "validate-partial": {
      addLog("info", "Validating partial update (PATCH)...", params, "zod");

      const errors: { path: string[]; message: string; code: string }[] = [];
      const validFields: Record<string, unknown> = {};

      if (params.name !== undefined) {
        const name = String(params.name);
        if (name.length < 2) {
          errors.push({
            path: ["name"],
            message: "Name must be at least 2 characters",
            code: "too_small",
          });
        } else {
          validFields.name = name;
        }
      }

      if (params.email !== undefined) {
        const email = String(params.email);
        if (!email.includes("@") || !email.includes(".")) {
          errors.push({
            path: ["email"],
            message: "Invalid email address",
            code: "invalid_string",
          });
        } else {
          validFields.email = email;
        }
      }

      const visualizationData = {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        data: errors.length === 0 ? validFields : undefined,
        inputData: params,
        isPartial: true,
      };

      if (errors.length > 0) {
        errors.forEach((e) => {
          addLog("error", `${e.path.join(".")}: ${e.message}`, { code: e.code }, "zod");
        });
      } else {
        addLog("info", "✓ Partial validation passed", { fields: Object.keys(validFields) }, "zod");
      }

      return {
        success: true,
        result: visualizationData,
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 3 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData,
      };
    }

    default:
      return {
        success: false,
        error: `Unknown action: ${action}`,
        logs,
        steps: [],
        duration: Date.now() - startTime,
      };
  }
}

// Error handling demo actions
function executeErrorHandlingAction(
  action: string,
  params: Record<string, unknown>,
  sessionId: string,
  demoSteps: ExecutionStep[],
  logs: LogEntry[],
  addLog: (
    level: LogEntry["level"],
    message: string,
    data?: Record<string, unknown>,
    source?: string
  ) => void,
  startTime: number
): ExecuteResponse {
  const createErrorResponse = (
    errorType: string,
    statusCode: number,
    message: string,
    code: string,
    handled: boolean
  ): ExecuteResponse => {
    const visualizationData: ErrorVisualizationData = {
      errorType,
      statusCode,
      message,
      code,
      timestamp: Date.now(),
      handled,
      stack: handled
        ? undefined
        : [
            `at handleRequest (/app/api/route.ts:45:11)`,
            `at processTicksAndRejections (internal/process/task_queues.js:95:5)`,
            `at async NextServer.handleRequest (/node_modules/next/server.js:312:24)`,
          ],
    };

    return {
      success: true,
      result: { errorType, statusCode, code },
      logs,
      steps: demoSteps.map((s, i) => ({
        ...s,
        status: i < 3 ? "completed" : ("pending" as const),
      })),
      duration: Date.now() - startTime,
      visualizationData,
    };
  };

  switch (action) {
    case "trigger-404": {
      const resource = String(params.resource || "User");
      addLog("info", `Looking up ${resource}...`, undefined, "api");
      addLog("error", `${resource} not found`, { code: "NOT_FOUND", statusCode: 404 }, "error");
      return createErrorResponse("NotFoundError", 404, `${resource} not found`, "NOT_FOUND", true);
    }

    case "trigger-401": {
      addLog("info", "Checking authentication...", undefined, "auth");
      addLog("error", "No valid session found", { code: "UNAUTHORIZED", statusCode: 401 }, "error");
      return createErrorResponse(
        "UnauthorizedError",
        401,
        "Authentication required",
        "UNAUTHORIZED",
        true
      );
    }

    case "trigger-403": {
      addLog("info", "Checking permissions...", undefined, "auth");
      addLog(
        "error",
        "User lacks required permissions",
        { code: "FORBIDDEN", statusCode: 403 },
        "error"
      );
      return createErrorResponse("ForbiddenError", 403, "Access denied", "FORBIDDEN", true);
    }

    case "trigger-validation": {
      addLog("info", "Validating request body...", undefined, "validation");
      addLog("error", "Validation failed", { fields: ["email", "password"] }, "error");
      return createErrorResponse(
        "ValidationError",
        400,
        "Validation failed",
        "VALIDATION_ERROR",
        true
      );
    }

    case "trigger-500": {
      addLog("info", "Processing request...", undefined, "api");
      addLog(
        "error",
        "Unexpected error occurred",
        { stack: "TypeError: Cannot read property..." },
        "error"
      );
      return createErrorResponse(
        "Error",
        500,
        "An unexpected error occurred",
        "INTERNAL_ERROR",
        false
      );
    }

    case "handle-graceful": {
      addLog("info", "Starting operation...", undefined, "api");
      addLog("warn", "Potential issue detected", undefined, "api");
      addLog("info", "Attempting recovery...", undefined, "api");
      addLog("info", "Operation completed with fallback", undefined, "api");
      return createErrorResponse("AppError", 200, "Request handled gracefully", "SUCCESS", true);
    }

    default:
      return {
        success: false,
        error: `Unknown action: ${action}`,
        logs,
        steps: [],
        duration: Date.now() - startTime,
      };
  }
}

// Logging demo actions
function executeLoggingAction(
  action: string,
  params: Record<string, unknown>,
  sessionId: string,
  demoSteps: ExecutionStep[],
  logs: LogEntry[],
  addLog: (
    level: LogEntry["level"],
    message: string,
    data?: Record<string, unknown>,
    source?: string
  ) => void,
  startTime: number
): ExecuteResponse {
  const logStore: LogEntry[] = [];
  const levels = { debug: 0, info: 0, warn: 0, error: 0 };

  const addDemoLog = (
    level: LogEntry["level"],
    message: string,
    data?: Record<string, unknown>
  ) => {
    levels[level]++;
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      data,
      source: "pino",
    };
    logStore.push(entry);
    logs.push(entry);
  };

  switch (action) {
    case "log-debug": {
      const message = String(params.message || "Debug message");
      addDemoLog("debug", message, { requestId: "req_abc123" });
      break;
    }

    case "log-info": {
      const message = String(params.message || "Info message");
      addDemoLog("info", message, { userId: "user_456" });
      break;
    }

    case "log-warn": {
      const message = String(params.message || "Warning message");
      addDemoLog("warn", message, { deprecation: "v2.0" });
      break;
    }

    case "log-error": {
      const message = String(params.message || "Error message");
      addDemoLog("error", message, { stack: "Error: Something went wrong..." });
      break;
    }

    case "log-request": {
      addDemoLog("info", "Incoming request", {
        method: "POST",
        path: "/api/users",
        requestId: "req_xyz789",
      });
      addDemoLog("debug", "Request body parsed", { size: 256 });
      addDemoLog("debug", "Database query executed", { duration: 45 });
      addDemoLog("info", "Request completed", { status: 200, duration: 127 });
      break;
    }

    case "log-sensitive": {
      addDemoLog("info", "User login attempt", {
        email: "john@example.com",
        password: "[REDACTED]",
        token: "[REDACTED]",
      });
      addDemoLog("debug", "Session created", { sessionId: "sess_abc", secret: "[REDACTED]" });
      break;
    }

    default:
      return {
        success: false,
        error: `Unknown action: ${action}`,
        logs,
        steps: [],
        duration: Date.now() - startTime,
      };
  }

  const visualizationData: LogStreamData = {
    entries: logStore,
    levels,
    filter: "all",
  };

  return {
    success: true,
    result: { logged: logStore.length },
    logs,
    steps: demoSteps.map((s, i) => ({ ...s, status: i < 3 ? "completed" : ("pending" as const) })),
    duration: Date.now() - startTime,
    visualizationData,
  };
}

// Environment validation demo actions
function executeEnvAction(
  action: string,
  params: Record<string, unknown>,
  sessionId: string,
  demoSteps: ExecutionStep[],
  logs: LogEntry[],
  addLog: (
    level: LogEntry["level"],
    message: string,
    data?: Record<string, unknown>,
    source?: string
  ) => void,
  startTime: number
): ExecuteResponse {
  switch (action) {
    case "validate-complete": {
      addLog("info", "Parsing environment variables...", undefined, "env");
      const result = sandboxEnv.validateComplete();
      addLog("info", "All environment variables valid", { count: result.variables.length }, "env");

      return {
        success: true,
        result: { valid: true },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 4 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData: result as EnvValidationData,
      };
    }

    case "validate-missing": {
      addLog("info", "Parsing environment variables...", undefined, "env");
      const result = sandboxEnv.validateMissing();
      result.missingRequired.forEach((key) => {
        addLog("error", `Missing required: ${key}`, undefined, "env");
      });

      return {
        success: true,
        result: { valid: false, missing: result.missingRequired },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 2 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData: result as EnvValidationData,
      };
    }

    case "validate-invalid": {
      addLog("info", "Parsing environment variables...", undefined, "env");
      const result = sandboxEnv.validateInvalid();
      result.invalidValues.forEach((iv) => {
        addLog(
          "error",
          `Invalid ${iv.key}: expected ${iv.expected}, got ${iv.received}`,
          undefined,
          "env"
        );
      });

      return {
        success: true,
        result: { valid: false, invalid: result.invalidValues.length },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 2 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData: result as EnvValidationData,
      };
    }

    case "check-single": {
      const key = String(params.key || "CUSTOM_VAR");
      const value = String(params.value || "");
      addLog(
        "info",
        `Checking ${key}...`,
        { value: value.length > 20 ? value.slice(0, 20) + "..." : value },
        "env"
      );

      const envVar = sandboxEnv.checkSingle(key, value);
      if (envVar.valid) {
        addLog("info", `${key} is valid`, undefined, "env");
      } else {
        addLog("error", `${key} is invalid: ${envVar.error}`, undefined, "env");
      }

      const result: EnvValidationData = {
        variables: [envVar],
        valid: envVar.valid,
        missingRequired: envVar.valid ? [] : [key],
        invalidValues: envVar.valid ? [] : [{ key, expected: envVar.type, received: value }],
      };

      return {
        success: true,
        result: { variable: key, valid: envVar.valid },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 2 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData: result,
      };
    }

    default:
      return {
        success: false,
        error: `Unknown action: ${action}`,
        logs,
        steps: [],
        duration: Date.now() - startTime,
      };
  }
}

// Sessions demo actions
function executeSessionsAction(
  action: string,
  params: Record<string, unknown>,
  sessionId: string,
  demoSteps: ExecutionStep[],
  logs: LogEntry[],
  addLog: (
    level: LogEntry["level"],
    message: string,
    data?: Record<string, unknown>,
    source?: string
  ) => void,
  startTime: number
): ExecuteResponse {
  switch (action) {
    case "create-session": {
      const device = params.device ? String(params.device) : undefined;
      addLog("info", "Creating new session...", { device }, "session");
      const session = sandboxSessions.create(sessionId, device);
      addLog(
        "info",
        `Session created: ${session.id}`,
        { device: session.device, browser: session.browser },
        "session"
      );

      const data = sandboxSessions.list(sessionId);
      return {
        success: true,
        result: { sessionId: session.id },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 2 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData: data as SessionVisualizationData,
      };
    }

    case "list-sessions": {
      addLog("info", "Fetching active sessions...", undefined, "session");
      const data = sandboxSessions.list(sessionId);
      addLog("info", `Found ${data.sessions.length} active sessions`, undefined, "session");

      return {
        success: true,
        result: { count: data.sessions.length },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 2 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData: data as SessionVisualizationData,
      };
    }

    case "revoke-session": {
      const targetId = String(params.sessionId || "");
      if (!targetId) {
        addLog("error", "Session ID is required", undefined, "session");
        return {
          success: false,
          error: "Session ID is required",
          logs,
          steps: [],
          duration: Date.now() - startTime,
        };
      }

      addLog("info", `Revoking session: ${targetId}`, undefined, "session");
      const revoked = sandboxSessions.revoke(sessionId, targetId);

      if (revoked) {
        addLog("info", "Session revoked successfully", undefined, "session");
      } else {
        addLog("warn", "Session not found", undefined, "session");
      }

      const data = sandboxSessions.list(sessionId);
      return {
        success: true,
        result: { revoked },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 4 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData: data as SessionVisualizationData,
      };
    }

    case "revoke-all": {
      addLog("warn", "Revoking all sessions...", undefined, "session");
      const count = sandboxSessions.revokeAll(sessionId);
      addLog("info", `Revoked ${count} sessions`, undefined, "session");

      const data = sandboxSessions.list(sessionId);
      return {
        success: true,
        result: { revokedCount: count },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 4 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData: data as SessionVisualizationData,
      };
    }

    case "refresh-session": {
      addLog("info", "Refreshing current session...", undefined, "session");
      const session = sandboxSessions.refresh(sessionId);

      if (session) {
        addLog(
          "info",
          "Session refreshed",
          { expiresAt: new Date(session.expiresAt).toISOString() },
          "session"
        );
      } else {
        addLog("warn", "No current session to refresh", undefined, "session");
      }

      const data = sandboxSessions.list(sessionId);
      return {
        success: true,
        result: { refreshed: !!session },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 2 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData: data as SessionVisualizationData,
      };
    }

    default:
      return {
        success: false,
        error: `Unknown action: ${action}`,
        logs,
        steps: [],
        duration: Date.now() - startTime,
      };
  }
}

// Feature flags demo actions
function executeFeatureFlagsAction(
  action: string,
  params: Record<string, unknown>,
  sessionId: string,
  demoSteps: ExecutionStep[],
  logs: LogEntry[],
  addLog: (
    level: LogEntry["level"],
    message: string,
    data?: Record<string, unknown>,
    source?: string
  ) => void,
  startTime: number
): ExecuteResponse {
  switch (action) {
    case "check-flag": {
      const flagKey = String(params.flagKey || "");
      if (!flagKey) {
        return {
          success: false,
          error: "Flag key is required",
          logs,
          steps: [],
          duration: Date.now() - startTime,
        };
      }

      addLog("info", `Checking flag: ${flagKey}`, undefined, "flags");
      const result = sandboxFeatureFlags.checkFlag(sessionId, flagKey);

      if (!result.flag) {
        addLog("warn", `Flag not found: ${flagKey}`, undefined, "flags");
      } else {
        addLog(
          result.enabled ? "info" : "debug",
          `Flag ${flagKey}: ${result.enabled ? "ENABLED" : "DISABLED"}`,
          { reason: result.reason },
          "flags"
        );
      }

      const visualizationData: FeatureFlagsVisualizationData = {
        ...sandboxFeatureFlags.getVisualizationData(sessionId),
        lastAction: { type: "check", flagKey, result: result.enabled },
      };

      return {
        success: true,
        result: { flagKey, enabled: result.enabled, reason: result.reason },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 2 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData,
      };
    }

    case "check-as-user": {
      const flagKey = String(params.flagKey || "");
      const userId = String(params.userId || "");

      if (!flagKey || !userId) {
        return {
          success: false,
          error: "Flag key and user ID are required",
          logs,
          steps: [],
          duration: Date.now() - startTime,
        };
      }

      addLog("info", `Checking flag ${flagKey} for user ${userId}`, undefined, "flags");
      const result = sandboxFeatureFlags.checkFlag(sessionId, flagKey, userId);

      addLog(
        result.enabled ? "info" : "debug",
        `Flag ${flagKey} for ${userId}: ${result.enabled ? "ENABLED" : "DISABLED"}`,
        { reason: result.reason },
        "flags"
      );

      const visualizationData: FeatureFlagsVisualizationData = {
        ...sandboxFeatureFlags.getVisualizationData(sessionId),
        lastAction: { type: "check", flagKey, result: result.enabled },
      };

      return {
        success: true,
        result: { flagKey, userId, enabled: result.enabled, reason: result.reason },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 2 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData,
      };
    }

    case "toggle-flag": {
      const flagKey = String(params.flagKey || "");
      if (!flagKey) {
        return {
          success: false,
          error: "Flag key is required",
          logs,
          steps: [],
          duration: Date.now() - startTime,
        };
      }

      addLog("info", `Toggling flag: ${flagKey}`, undefined, "flags");
      const flag = sandboxFeatureFlags.toggleFlag(sessionId, flagKey);

      if (!flag) {
        addLog("error", `Flag not found: ${flagKey}`, undefined, "flags");
        return {
          success: false,
          error: `Flag not found: ${flagKey}`,
          logs,
          steps: [],
          duration: Date.now() - startTime,
        };
      }

      addLog(
        "info",
        `Flag ${flagKey} is now ${flag.enabled ? "ENABLED" : "DISABLED"}`,
        undefined,
        "flags"
      );

      const visualizationData: FeatureFlagsVisualizationData = {
        ...sandboxFeatureFlags.getVisualizationData(sessionId),
        lastAction: { type: "toggle", flagKey, result: flag.enabled },
      };

      return {
        success: true,
        result: { flagKey, enabled: flag.enabled },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 2 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData,
      };
    }

    case "set-rollout": {
      const flagKey = String(params.flagKey || "");
      const percentage = Number(params.percentage ?? 50);

      if (!flagKey) {
        return {
          success: false,
          error: "Flag key is required",
          logs,
          steps: [],
          duration: Date.now() - startTime,
        };
      }

      addLog("info", `Setting rollout for ${flagKey} to ${percentage}%`, undefined, "flags");
      const flag = sandboxFeatureFlags.setRollout(sessionId, flagKey, percentage);

      if (!flag) {
        addLog("error", `Flag not found: ${flagKey}`, undefined, "flags");
        return {
          success: false,
          error: `Flag not found: ${flagKey}`,
          logs,
          steps: [],
          duration: Date.now() - startTime,
        };
      }

      addLog(
        "info",
        `Rollout updated: ${flag.rolloutPercentage}% of users will see ${flagKey}`,
        undefined,
        "flags"
      );

      const visualizationData: FeatureFlagsVisualizationData = {
        ...sandboxFeatureFlags.getVisualizationData(sessionId),
        lastAction: { type: "rollout", flagKey },
      };

      return {
        success: true,
        result: { flagKey, rolloutPercentage: flag.rolloutPercentage },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 3 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData,
      };
    }

    case "target-user": {
      const flagKey = String(params.flagKey || "");
      const userId = String(params.userId || "");

      if (!flagKey || !userId) {
        return {
          success: false,
          error: "Flag key and user ID are required",
          logs,
          steps: [],
          duration: Date.now() - startTime,
        };
      }

      addLog("info", `Adding ${userId} to targeted users for ${flagKey}`, undefined, "flags");
      const flag = sandboxFeatureFlags.targetUser(sessionId, flagKey, userId);

      if (!flag) {
        addLog("error", `Flag not found: ${flagKey}`, undefined, "flags");
        return {
          success: false,
          error: `Flag not found: ${flagKey}`,
          logs,
          steps: [],
          duration: Date.now() - startTime,
        };
      }

      addLog(
        "info",
        `User ${userId} added to ${flagKey} targets`,
        { targets: flag.targetedUsers },
        "flags"
      );

      const visualizationData: FeatureFlagsVisualizationData = {
        ...sandboxFeatureFlags.getVisualizationData(sessionId),
        lastAction: { type: "target", flagKey },
      };

      return {
        success: true,
        result: { flagKey, targetedUsers: flag.targetedUsers },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 2 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData,
      };
    }

    case "switch-user": {
      const userId = String(params.userId || "");
      if (!userId) {
        return {
          success: false,
          error: "User ID is required",
          logs,
          steps: [],
          duration: Date.now() - startTime,
        };
      }

      addLog("info", `Switching current user to: ${userId}`, undefined, "flags");
      sandboxFeatureFlags.setCurrentUser(sessionId, userId);
      addLog("info", `User context updated`, { userId }, "flags");

      const visualizationData: FeatureFlagsVisualizationData = {
        ...sandboxFeatureFlags.getVisualizationData(sessionId),
      };

      return {
        success: true,
        result: { userId },
        logs,
        steps: demoSteps.map((s, i) => ({
          ...s,
          status: i < 1 ? "completed" : ("pending" as const),
        })),
        duration: Date.now() - startTime,
        visualizationData,
      };
    }

    default:
      return {
        success: false,
        error: `Unknown action: ${action}`,
        logs,
        steps: [],
        duration: Date.now() - startTime,
      };
  }
}
