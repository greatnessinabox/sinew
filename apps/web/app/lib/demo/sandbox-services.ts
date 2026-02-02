// Sandbox implementations of external services for demos
// These run entirely in-memory with no external dependencies

import type {
  CacheEntry,
  CacheStats,
  LogEntry,
  RateLimitData,
  FeatureFlag,
  FlagEvaluation,
} from "./types";

// ============================================================================
// In-Memory LRU Cache
// ============================================================================

interface CacheStore {
  entries: Map<
    string,
    { value: unknown; ttl: number | null; createdAt: number; accessedAt: number }
  >;
  maxSize: number;
  hits: number;
  misses: number;
}

const cacheStores = new Map<string, CacheStore>();

function getCacheStore(sessionId: string): CacheStore {
  let store = cacheStores.get(sessionId);
  if (!store) {
    store = {
      entries: new Map(),
      maxSize: 10,
      hits: 0,
      misses: 0,
    };
    cacheStores.set(sessionId, store);
  }
  return store;
}

export const sandboxCache = {
  get(sessionId: string, key: string): { value: unknown; hit: boolean } {
    const store = getCacheStore(sessionId);
    const entry = store.entries.get(key);

    if (!entry) {
      store.misses++;
      return { value: undefined, hit: false };
    }

    // Check TTL
    if (entry.ttl && Date.now() > entry.createdAt + entry.ttl) {
      store.entries.delete(key);
      store.misses++;
      return { value: undefined, hit: false };
    }

    // Update access time (LRU)
    entry.accessedAt = Date.now();
    store.entries.delete(key);
    store.entries.set(key, entry);
    store.hits++;

    return { value: entry.value, hit: true };
  },

  set(sessionId: string, key: string, value: unknown, ttl?: number): { evicted: string | null } {
    const store = getCacheStore(sessionId);
    let evicted: string | null = null;

    // Check if we need to evict
    if (store.entries.size >= store.maxSize && !store.entries.has(key)) {
      // Evict oldest (first in Map)
      const oldestKey = store.entries.keys().next().value;
      if (oldestKey) {
        store.entries.delete(oldestKey);
        evicted = oldestKey;
      }
    }

    // Remove existing entry first to update LRU order
    store.entries.delete(key);

    store.entries.set(key, {
      value,
      ttl: ttl ?? null,
      createdAt: Date.now(),
      accessedAt: Date.now(),
    });

    return { evicted };
  },

  delete(sessionId: string, key: string): boolean {
    const store = getCacheStore(sessionId);
    return store.entries.delete(key);
  },

  clear(sessionId: string): number {
    const store = getCacheStore(sessionId);
    const count = store.entries.size;
    store.entries.clear();
    store.hits = 0;
    store.misses = 0;
    return count;
  },

  getStats(sessionId: string): CacheStats {
    const store = getCacheStore(sessionId);
    const total = store.hits + store.misses;
    return {
      size: store.entries.size,
      maxSize: store.maxSize,
      hits: store.hits,
      misses: store.misses,
      hitRate: total > 0 ? store.hits / total : 0,
    };
  },

  getEntries(sessionId: string): CacheEntry[] {
    const store = getCacheStore(sessionId);
    const entries: CacheEntry[] = [];

    store.entries.forEach((entry, key) => {
      entries.push({
        key,
        value: entry.value,
        ttl: entry.ttl,
        createdAt: entry.createdAt,
        accessedAt: entry.accessedAt,
      });
    });

    return entries;
  },

  setMaxSize(sessionId: string, maxSize: number): void {
    const store = getCacheStore(sessionId);
    store.maxSize = maxSize;

    // Evict if necessary
    while (store.entries.size > maxSize) {
      const oldestKey = store.entries.keys().next().value;
      if (oldestKey) {
        store.entries.delete(oldestKey);
      }
    }
  },
};

// ============================================================================
// In-Memory Rate Limiter (Sliding Window)
// ============================================================================

interface RateLimitStore {
  requests: { timestamp: number; allowed: boolean }[];
  limit: number;
  windowMs: number;
}

const rateLimitStores = new Map<string, RateLimitStore>();

function getRateLimitStore(sessionId: string): RateLimitStore {
  let store = rateLimitStores.get(sessionId);
  if (!store) {
    store = {
      requests: [],
      limit: 5,
      windowMs: 10000, // 10 seconds for demo
    };
    rateLimitStores.set(sessionId, store);
  }
  return store;
}

export const sandboxRateLimit = {
  check(sessionId: string): RateLimitData {
    const store = getRateLimitStore(sessionId);
    const now = Date.now();
    const windowStart = now - store.windowMs;

    // Remove old requests outside window
    store.requests = store.requests.filter((r) => r.timestamp > windowStart);

    // Count requests in window
    const requestsInWindow = store.requests.filter((r) => r.allowed).length;
    const remaining = Math.max(0, store.limit - requestsInWindow);
    const blocked = remaining === 0;

    // Record this request
    store.requests.push({ timestamp: now, allowed: !blocked });

    return {
      limit: store.limit,
      remaining: blocked ? 0 : remaining - 1,
      reset: windowStart + store.windowMs,
      blocked,
      requests: store.requests.slice(-20), // Last 20 for visualization
    };
  },

  reset(sessionId: string): void {
    const store = getRateLimitStore(sessionId);
    store.requests = [];
  },

  setLimit(sessionId: string, limit: number): void {
    const store = getRateLimitStore(sessionId);
    store.limit = limit;
  },

  getStatus(sessionId: string): RateLimitData {
    const store = getRateLimitStore(sessionId);
    const now = Date.now();
    const windowStart = now - store.windowMs;

    // Remove old requests
    store.requests = store.requests.filter((r) => r.timestamp > windowStart);

    const requestsInWindow = store.requests.filter((r) => r.allowed).length;

    return {
      limit: store.limit,
      remaining: Math.max(0, store.limit - requestsInWindow),
      reset: windowStart + store.windowMs,
      blocked: false,
      requests: store.requests.slice(-20),
    };
  },
};

// ============================================================================
// Log Buffer
// ============================================================================

const logBuffers = new Map<string, LogEntry[]>();

export const sandboxLogger = {
  log(
    sessionId: string,
    level: LogEntry["level"],
    message: string,
    data?: Record<string, unknown>,
    source = "system",
    step?: string
  ): LogEntry {
    let buffer = logBuffers.get(sessionId);
    if (!buffer) {
      buffer = [];
      logBuffers.set(sessionId, buffer);
    }

    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      data,
      source,
      step,
    };

    buffer.push(entry);

    // Keep last 100 logs
    if (buffer.length > 100) {
      buffer.shift();
    }

    return entry;
  },

  getLogs(sessionId: string): LogEntry[] {
    return logBuffers.get(sessionId) ?? [];
  },

  clear(sessionId: string): void {
    logBuffers.delete(sessionId);
  },
};

// ============================================================================
// Session Cleanup
// ============================================================================

export function cleanupSession(sessionId: string): void {
  cacheStores.delete(sessionId);
  rateLimitStores.delete(sessionId);
  logBuffers.delete(sessionId);
}

// Auto-cleanup old sessions (older than 1 hour)
const SESSION_TTL = 60 * 60 * 1000;
const sessionTimestamps = new Map<string, number>();

export function touchSession(sessionId: string): void {
  sessionTimestamps.set(sessionId, Date.now());
}

export function cleanupOldSessions(): void {
  const now = Date.now();
  sessionTimestamps.forEach((timestamp, sessionId) => {
    if (now - timestamp > SESSION_TTL) {
      cleanupSession(sessionId);
      sessionTimestamps.delete(sessionId);
    }
  });
}

// ============================================================================
// Session Management Demo
// ============================================================================

interface DemoSession {
  id: string;
  userId: string;
  device: string;
  browser: string;
  ip: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
}

const sessionDemoStores = new Map<string, { sessions: DemoSession[]; currentId: string | null }>();

function getSessionDemoStore(demoSessionId: string) {
  let store = sessionDemoStores.get(demoSessionId);
  if (!store) {
    store = { sessions: [], currentId: null };
    sessionDemoStores.set(demoSessionId, store);
  }
  return store;
}

const devices = [
  "MacBook Pro",
  "iPhone 15",
  "Windows Desktop",
  "iPad Air",
  "Android Phone",
  "Linux Workstation",
];
const browsers = ["Chrome 120", "Safari 17", "Firefox 121", "Edge 120", "Arc Browser"];

export const sandboxSessions = {
  create(demoSessionId: string, device?: string): DemoSession {
    const store = getSessionDemoStore(demoSessionId);
    const now = Date.now();
    const session: DemoSession = {
      id: `sess_${Math.random().toString(36).slice(2, 11)}`,
      userId: "user_demo123",
      device: device || devices[Math.floor(Math.random() * devices.length)] || "Unknown",
      browser: browsers[Math.floor(Math.random() * browsers.length)] || "Unknown",
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days
      lastActivity: now,
    };
    store.sessions.push(session);
    if (!store.currentId) store.currentId = session.id;
    return session;
  },

  list(demoSessionId: string) {
    const store = getSessionDemoStore(demoSessionId);
    return {
      sessions: store.sessions.map((s) => ({
        ...s,
        isCurrent: s.id === store.currentId,
      })),
      currentSessionId: store.currentId,
      stats: {
        total: store.sessions.length,
        active: store.sessions.filter((s) => s.expiresAt > Date.now()).length,
        expired: store.sessions.filter((s) => s.expiresAt <= Date.now()).length,
      },
    };
  },

  revoke(demoSessionId: string, sessionId: string): boolean {
    const store = getSessionDemoStore(demoSessionId);
    const idx = store.sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return false;
    store.sessions.splice(idx, 1);
    if (store.currentId === sessionId) {
      store.currentId = store.sessions[0]?.id || null;
    }
    return true;
  },

  revokeAll(demoSessionId: string): number {
    const store = getSessionDemoStore(demoSessionId);
    const count = store.sessions.length;
    store.sessions = [];
    store.currentId = null;
    return count;
  },

  refresh(demoSessionId: string): DemoSession | null {
    const store = getSessionDemoStore(demoSessionId);
    if (!store.currentId) return null;
    const session = store.sessions.find((s) => s.id === store.currentId);
    if (!session) return null;
    session.lastActivity = Date.now();
    session.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    return session;
  },
};

// ============================================================================
// Environment Validation Demo
// ============================================================================

interface EnvVar {
  key: string;
  value: string | undefined;
  required: boolean;
  type: "string" | "number" | "url" | "boolean" | "enum";
  valid: boolean;
  error?: string;
  isSecret: boolean;
}

export const sandboxEnv = {
  validateComplete(): {
    variables: EnvVar[];
    valid: boolean;
    missingRequired: string[];
    invalidValues: { key: string; expected: string; received: string }[];
  } {
    const variables: EnvVar[] = [
      {
        key: "NODE_ENV",
        value: "production",
        required: true,
        type: "enum",
        valid: true,
        isSecret: false,
      },
      {
        key: "DATABASE_URL",
        value: "postgresql://user:pass@localhost:5432/db",
        required: true,
        type: "url",
        valid: true,
        isSecret: true,
      },
      {
        key: "AUTH_SECRET",
        value: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
        required: true,
        type: "string",
        valid: true,
        isSecret: true,
      },
      { key: "PORT", value: "3000", required: false, type: "number", valid: true, isSecret: false },
      {
        key: "LOG_LEVEL",
        value: "info",
        required: false,
        type: "enum",
        valid: true,
        isSecret: false,
      },
      {
        key: "GITHUB_CLIENT_ID",
        value: "gh_client_abc123",
        required: false,
        type: "string",
        valid: true,
        isSecret: false,
      },
      {
        key: "GITHUB_CLIENT_SECRET",
        value: "gh_secret_xyz789",
        required: false,
        type: "string",
        valid: true,
        isSecret: true,
      },
    ];
    return { variables, valid: true, missingRequired: [], invalidValues: [] };
  },

  validateMissing(): {
    variables: EnvVar[];
    valid: boolean;
    missingRequired: string[];
    invalidValues: { key: string; expected: string; received: string }[];
  } {
    const variables: EnvVar[] = [
      {
        key: "NODE_ENV",
        value: "development",
        required: true,
        type: "enum",
        valid: true,
        isSecret: false,
      },
      {
        key: "DATABASE_URL",
        value: undefined,
        required: true,
        type: "url",
        valid: false,
        error: "Required",
        isSecret: true,
      },
      {
        key: "AUTH_SECRET",
        value: undefined,
        required: true,
        type: "string",
        valid: false,
        error: "Required",
        isSecret: true,
      },
      { key: "PORT", value: "3000", required: false, type: "number", valid: true, isSecret: false },
    ];
    return {
      variables,
      valid: false,
      missingRequired: ["DATABASE_URL", "AUTH_SECRET"],
      invalidValues: [],
    };
  },

  validateInvalid(): {
    variables: EnvVar[];
    valid: boolean;
    missingRequired: string[];
    invalidValues: { key: string; expected: string; received: string }[];
  } {
    const variables: EnvVar[] = [
      {
        key: "NODE_ENV",
        value: "invalid-env",
        required: true,
        type: "enum",
        valid: false,
        error: "Must be development, test, or production",
        isSecret: false,
      },
      {
        key: "DATABASE_URL",
        value: "not-a-url",
        required: true,
        type: "url",
        valid: false,
        error: "Invalid URL format",
        isSecret: true,
      },
      {
        key: "AUTH_SECRET",
        value: "tooshort",
        required: true,
        type: "string",
        valid: false,
        error: "Must be at least 32 characters",
        isSecret: true,
      },
      {
        key: "PORT",
        value: "abc",
        required: false,
        type: "number",
        valid: false,
        error: "Expected number",
        isSecret: false,
      },
    ];
    return {
      variables,
      valid: false,
      missingRequired: [],
      invalidValues: [
        { key: "NODE_ENV", expected: "development | test | production", received: "invalid-env" },
        { key: "DATABASE_URL", expected: "URL", received: "not-a-url" },
        { key: "AUTH_SECRET", expected: "string (min 32 chars)", received: "tooshort (8 chars)" },
        { key: "PORT", expected: "number", received: "abc" },
      ],
    };
  },

  checkSingle(key: string, value: string): EnvVar {
    const urlPattern = /^(https?|postgresql|mysql):\/\/.+/;
    const isUrl = key.includes("URL");
    const isSecret = key.includes("SECRET") || key.includes("KEY") || key.includes("PASSWORD");

    let valid = true;
    let error: string | undefined;

    if (isUrl && !urlPattern.test(value)) {
      valid = false;
      error = "Invalid URL format";
    } else if (key === "NODE_ENV" && !["development", "test", "production"].includes(value)) {
      valid = false;
      error = "Must be development, test, or production";
    }

    return {
      key,
      value,
      required: true,
      type: isUrl ? "url" : "string",
      valid,
      error,
      isSecret,
    };
  },
};

// ============================================================================
// Feature Flags Demo
// ============================================================================

interface FeatureFlagsStore {
  flags: Map<string, FeatureFlag>;
  evaluations: FlagEvaluation[];
  currentUser: string;
}

const featureFlagsStores = new Map<string, FeatureFlagsStore>();

function getFeatureFlagsStore(sessionId: string): FeatureFlagsStore {
  let store = featureFlagsStores.get(sessionId);
  if (!store) {
    const now = Date.now();
    store = {
      flags: new Map([
        [
          "dark-mode",
          {
            key: "dark-mode",
            name: "Dark Mode",
            description: "Enable dark theme for all users",
            enabled: true,
            rolloutPercentage: 100,
            targetedUsers: [],
            createdAt: now - 86400000 * 7,
            updatedAt: now - 86400000,
          },
        ],
        [
          "new-dashboard",
          {
            key: "new-dashboard",
            name: "New Dashboard",
            description: "Redesigned dashboard with analytics",
            enabled: true,
            rolloutPercentage: 50,
            targetedUsers: ["user_beta1", "user_beta2"],
            createdAt: now - 86400000 * 3,
            updatedAt: now - 3600000,
          },
        ],
        [
          "ai-assistant",
          {
            key: "ai-assistant",
            name: "AI Assistant",
            description: "AI-powered writing assistant",
            enabled: true,
            rolloutPercentage: 10,
            targetedUsers: ["user_vip"],
            createdAt: now - 86400000,
            updatedAt: now - 1800000,
          },
        ],
        [
          "beta-api",
          {
            key: "beta-api",
            name: "Beta API v2",
            description: "New API endpoints (testing)",
            enabled: false,
            rolloutPercentage: 0,
            targetedUsers: [],
            createdAt: now - 3600000,
            updatedAt: now - 1800000,
          },
        ],
      ]),
      evaluations: [],
      currentUser: "user_" + Math.random().toString(36).slice(2, 8),
    };
    featureFlagsStores.set(sessionId, store);
  }
  return store;
}

function hashUserToPercentage(userId: string, flagKey: string): number {
  // Simple hash function for deterministic rollout
  let hash = 0;
  const str = `${userId}:${flagKey}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 100;
}

export const sandboxFeatureFlags = {
  checkFlag(
    sessionId: string,
    flagKey: string,
    userId?: string
  ): { enabled: boolean; reason: FlagEvaluation["reason"]; flag: FeatureFlag | null } {
    const store = getFeatureFlagsStore(sessionId);
    const effectiveUserId = userId || store.currentUser;
    const flag = store.flags.get(flagKey);

    if (!flag) {
      return { enabled: false, reason: "default", flag: null };
    }

    if (!flag.enabled) {
      const evaluation: FlagEvaluation = {
        userId: effectiveUserId,
        flagKey,
        enabled: false,
        reason: "disabled",
        timestamp: Date.now(),
      };
      store.evaluations.unshift(evaluation);
      if (store.evaluations.length > 50) store.evaluations.pop();
      return { enabled: false, reason: "disabled", flag };
    }

    // Check if user is targeted
    if (flag.targetedUsers.includes(effectiveUserId)) {
      const evaluation: FlagEvaluation = {
        userId: effectiveUserId,
        flagKey,
        enabled: true,
        reason: "targeted",
        timestamp: Date.now(),
      };
      store.evaluations.unshift(evaluation);
      if (store.evaluations.length > 50) store.evaluations.pop();
      return { enabled: true, reason: "targeted", flag };
    }

    // Check rollout percentage
    const userPercentage = hashUserToPercentage(effectiveUserId, flagKey);
    const enabled = userPercentage < flag.rolloutPercentage;

    const evaluation: FlagEvaluation = {
      userId: effectiveUserId,
      flagKey,
      enabled,
      reason: enabled ? "rollout" : "default",
      timestamp: Date.now(),
    };
    store.evaluations.unshift(evaluation);
    if (store.evaluations.length > 50) store.evaluations.pop();

    return { enabled, reason: enabled ? "rollout" : "default", flag };
  },

  toggleFlag(sessionId: string, flagKey: string): FeatureFlag | null {
    const store = getFeatureFlagsStore(sessionId);
    const flag = store.flags.get(flagKey);
    if (!flag) return null;

    flag.enabled = !flag.enabled;
    flag.updatedAt = Date.now();
    return flag;
  },

  setRollout(sessionId: string, flagKey: string, percentage: number): FeatureFlag | null {
    const store = getFeatureFlagsStore(sessionId);
    const flag = store.flags.get(flagKey);
    if (!flag) return null;

    flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
    flag.updatedAt = Date.now();
    return flag;
  },

  targetUser(sessionId: string, flagKey: string, userId: string): FeatureFlag | null {
    const store = getFeatureFlagsStore(sessionId);
    const flag = store.flags.get(flagKey);
    if (!flag) return null;

    if (!flag.targetedUsers.includes(userId)) {
      flag.targetedUsers.push(userId);
      flag.updatedAt = Date.now();
    }
    return flag;
  },

  removeTarget(sessionId: string, flagKey: string, userId: string): FeatureFlag | null {
    const store = getFeatureFlagsStore(sessionId);
    const flag = store.flags.get(flagKey);
    if (!flag) return null;

    flag.targetedUsers = flag.targetedUsers.filter((u) => u !== userId);
    flag.updatedAt = Date.now();
    return flag;
  },

  setCurrentUser(sessionId: string, userId: string): void {
    const store = getFeatureFlagsStore(sessionId);
    store.currentUser = userId;
  },

  getVisualizationData(sessionId: string) {
    const store = getFeatureFlagsStore(sessionId);
    const flags = Array.from(store.flags.values());
    return {
      flags,
      evaluations: store.evaluations.slice(0, 20),
      currentUser: store.currentUser,
      stats: {
        totalFlags: flags.length,
        enabledFlags: flags.filter((f) => f.enabled).length,
        evaluationsCount: store.evaluations.length,
      },
    };
  },

  reset(sessionId: string): void {
    featureFlagsStores.delete(sessionId);
  },
};
