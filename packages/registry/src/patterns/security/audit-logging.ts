import type { Pattern } from "../../schema.js";

export const auditLogging: Pattern = {
  name: "Audit Logging",
  slug: "audit-logging",
  description:
    "Structured audit trail for compliance and debugging. Tracks user actions with append-only database storage, actor identification, and resource tracking.",
  category: "security",
  frameworks: ["nextjs"],
  tier: "free",
  complexity: "intermediate",
  tags: ["audit", "logging", "compliance", "security", "pino"],
  files: {
    nextjs: [
      {
        path: "lib/audit/types.ts",
        content: `// Audit event types
export type AuditAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "export"
  | "import"
  | "permission_change"
  | "settings_change";

export type AuditStatus = "success" | "failure" | "pending";

// Actor who performed the action
export interface AuditActor {
  id: string;
  type: "user" | "system" | "api_key" | "webhook";
  email?: string;
  name?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Resource that was acted upon
export interface AuditResource {
  type: string; // e.g., "user", "order", "document"
  id: string;
  name?: string;
}

// Full audit event
export interface AuditEvent {
  id: string;
  timestamp: Date;
  action: AuditAction;
  status: AuditStatus;
  actor: AuditActor;
  resource: AuditResource;
  metadata?: Record<string, unknown>;
  // Changes made (for updates)
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  // Request context
  context?: {
    requestId?: string;
    sessionId?: string;
    origin?: string;
  };
}

// Simplified input for creating audit events
export interface AuditEventInput {
  action: AuditAction;
  status?: AuditStatus;
  actor: Partial<AuditActor> & { id: string };
  resource: AuditResource;
  metadata?: Record<string, unknown>;
  changes?: AuditEvent["changes"];
}
`,
      },
      {
        path: "lib/audit/logger.ts",
        content: `import pino from "pino";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { AuditEvent, AuditEventInput, AuditActor } from "./types";

// Pino logger configured for audit events.
// Pino already emits a "time" field; we only customize the level shape.
const logger = pino({
  name: "audit",
  level: "info",
  formatters: {
    level: (label) => ({ level: label }),
    bindings: () => ({}),
  },
});

// Optional in-memory store, only when no database is wired up (local dev).
// Set AUDIT_IN_MEMORY=1 to use it; it is per-instance and lost on restart,
// so it is NOT suitable for serverless or multi-instance deployments.
const useInMemory = process.env.AUDIT_IN_MEMORY === "1";
const auditStore: AuditEvent[] = [];

// Build a fully-populated actor, applying the "user" default without letting
// an explicit "type: undefined" from the caller clobber it.
function buildActor(input: AuditEventInput["actor"]): AuditActor {
  return {
    ...input,
    type: input.type ?? "user",
  };
}

// Create and log an audit event.
export async function audit(input: AuditEventInput): Promise<AuditEvent> {
  const event: AuditEvent = {
    id: randomUUID(),
    timestamp: new Date(),
    action: input.action,
    status: input.status ?? "success",
    actor: buildActor(input.actor),
    resource: input.resource,
    metadata: input.metadata,
    changes: input.changes,
  };

  // Log to pino (structured JSON) for observability/streaming.
  logger.info(
    {
      auditId: event.id,
      action: event.action,
      status: event.status,
      actorId: event.actor.id,
      actorType: event.actor.type,
      resourceType: event.resource.type,
      resourceId: event.resource.id,
      metadata: event.metadata,
      changes: event.changes,
    },
    \`\${event.action}:\${event.resource.type}:\${event.resource.id}\`
  );

  if (useInMemory) {
    auditStore.push(event);
    return event;
  }

  // Append-only persistence: the audit table should be insert-only at the DB
  // layer (no UPDATE/DELETE grants for the app role).
  await prisma.auditEvent.create({
    data: {
      id: event.id,
      timestamp: event.timestamp,
      action: event.action,
      status: event.status,
      actorId: event.actor.id,
      actorType: event.actor.type,
      actorEmail: event.actor.email,
      actorName: event.actor.name,
      ipAddress: event.actor.ipAddress,
      userAgent: event.actor.userAgent,
      resourceType: event.resource.type,
      resourceId: event.resource.id,
      resourceName: event.resource.name,
      metadata: event.metadata as object | undefined,
      changes: event.changes as object | undefined,
      requestId: event.context?.requestId,
      sessionId: event.context?.sessionId,
    },
  });

  return event;
}

// Query audit events.
export async function queryAuditEvents(options: {
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ events: AuditEvent[]; total: number }> {
  const { limit = 50, offset = 0 } = options;

  if (useInMemory) {
    let filtered = [...auditStore];

    if (options.actorId) {
      filtered = filtered.filter((e) => e.actor.id === options.actorId);
    }
    if (options.resourceType) {
      filtered = filtered.filter((e) => e.resource.type === options.resourceType);
    }
    if (options.resourceId) {
      filtered = filtered.filter((e) => e.resource.id === options.resourceId);
    }
    if (options.action) {
      filtered = filtered.filter((e) => e.action === options.action);
    }
    if (options.startDate) {
      filtered = filtered.filter((e) => e.timestamp >= options.startDate!);
    }
    if (options.endDate) {
      filtered = filtered.filter((e) => e.timestamp <= options.endDate!);
    }

    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = filtered.length;
    const events = filtered.slice(offset, offset + limit);
    return { events, total };
  }

  const where = {
    actorId: options.actorId,
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    action: options.action,
    timestamp:
      options.startDate || options.endDate
        ? { gte: options.startDate, lte: options.endDate }
        : undefined,
  };

  const [rows, total] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditEvent.count({ where }),
  ]);

  const events: AuditEvent[] = rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    action: row.action as AuditEvent["action"],
    status: row.status as AuditEvent["status"],
    actor: {
      id: row.actorId,
      type: row.actorType as AuditActor["type"],
      email: row.actorEmail ?? undefined,
      name: row.actorName ?? undefined,
      ipAddress: row.ipAddress ?? undefined,
      userAgent: row.userAgent ?? undefined,
    },
    resource: {
      type: row.resourceType,
      id: row.resourceId,
      name: row.resourceName ?? undefined,
    },
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
    changes: (row.changes as AuditEvent["changes"]) ?? undefined,
    context: {
      requestId: row.requestId ?? undefined,
      sessionId: row.sessionId ?? undefined,
    },
  }));

  return { events, total };
}

// Get audit events for a specific resource
export async function getResourceAuditTrail(
  resourceType: string,
  resourceId: string
): Promise<AuditEvent[]> {
  const { events } = await queryAuditEvents({
    resourceType,
    resourceId,
    limit: 100,
  });
  return events;
}

// Get audit events for a specific user
export async function getUserAuditTrail(userId: string): Promise<AuditEvent[]> {
  const { events } = await queryAuditEvents({
    actorId: userId,
    limit: 100,
  });
  return events;
}
`,
      },
      {
        path: "lib/audit/middleware.ts",
        content: `import { NextRequest } from "next/server";
import { audit } from "./logger";
import type { AuditAction, AuditActor } from "./types";

// SECURITY: the actor id is read from the "x-user-id" request header below.
// That header is client-controlled, so it MUST be set (and any inbound copy
// stripped) by your verified auth layer before this wrapper runs. Without
// that, callers can forge the audited actor.

// Extract actor information from request
export function extractActor(req: NextRequest): Partial<AuditActor> {
  return {
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  };
}

// Wrap API handler with audit logging
export function withAuditLog<T>(
  action: AuditAction,
  resourceType: string,
  handler: (
    req: NextRequest,
    context: { auditActor: Partial<AuditActor> }
  ) => Promise<{ response: Response; resourceId?: string; metadata?: Record<string, unknown> }>
) {
  return async (req: NextRequest) => {
    const actorInfo = extractActor(req);
    const startTime = Date.now();

    try {
      const { response, resourceId, metadata } = await handler(req, {
        auditActor: actorInfo,
      });

      // Log successful action
      if (resourceId) {
        await audit({
          action,
          status: response.ok ? "success" : "failure",
          actor: {
            id: req.headers.get("x-user-id") ?? "unknown",
            ...actorInfo,
          },
          resource: {
            type: resourceType,
            id: resourceId,
          },
          metadata: {
            ...metadata,
            durationMs: Date.now() - startTime,
            statusCode: response.status,
          },
        });
      }

      return response;
    } catch (error) {
      // Log failed action
      await audit({
        action,
        status: "failure",
        actor: {
          id: req.headers.get("x-user-id") ?? "unknown",
          ...actorInfo,
        },
        resource: {
          type: resourceType,
          id: "unknown",
        },
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
          durationMs: Date.now() - startTime,
        },
      });

      throw error;
    }
  };
}
`,
      },
      {
        path: "app/api/audit/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { queryAuditEvents } from "@/lib/audit/logger";

// Get audit events (admin only)
export async function GET(req: NextRequest) {
  // TODO: Add authentication and admin check
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;

  const { events, total } = await queryAuditEvents({
    actorId: searchParams.get("actorId") ?? undefined,
    resourceType: searchParams.get("resourceType") ?? undefined,
    resourceId: searchParams.get("resourceId") ?? undefined,
    action: searchParams.get("action") ?? undefined,
    startDate: searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined,
    endDate: searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined,
    limit: parseInt(searchParams.get("limit") ?? "50"),
    offset: parseInt(searchParams.get("offset") ?? "0"),
  });

  return NextResponse.json({ events, total });
}
`,
      },
      {
        path: "prisma/schema.prisma.example",
        content: `// Add this model to your Prisma schema. audit() persists here by default;
// grant the app DB role INSERT/SELECT only (no UPDATE/DELETE) to keep it
// append-only.

model AuditEvent {
  id          String   @id @default(cuid())
  timestamp   DateTime @default(now())
  action      String
  status      String

  // Actor
  actorId     String
  actorType   String
  actorEmail  String?
  actorName   String?
  ipAddress   String?
  userAgent   String?

  // Resource
  resourceType String
  resourceId   String
  resourceName String?

  // Details
  metadata    Json?
  changes     Json?

  // Context
  requestId   String?
  sessionId   String?

  // Indexes for common queries
  @@index([actorId])
  @@index([resourceType, resourceId])
  @@index([action])
  @@index([timestamp])
}
`,
      },
      {
        path: "lib/prisma.ts",
        content: `import { PrismaClient } from "@prisma/client";

// Reuse a single client across hot reloads / lambda invocations.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
`,
      },
      {
        path: ".env.example",
        content: `# Audit logs persist to your database via Prisma by default.
# DATABASE_URL is required (used by the Prisma client in lib/prisma.ts).
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Local-only fallback: set to 1 to use an in-memory store instead of the DB.
# Per-instance and lost on restart, so do NOT use in serverless/multi-instance.
# AUDIT_IN_MEMORY=1

# Optionally stream pino output to a log aggregator (Datadog, Axiom, etc.).
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [
      { name: "pino", version: "^10.0.0" },
      { name: "@prisma/client", version: "^6.0.0" },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  devDependencies: {
    nextjs: [
      { name: "pino-pretty", version: "^13.0.0", dev: true },
      { name: "prisma", version: "^6.0.0", dev: true },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
