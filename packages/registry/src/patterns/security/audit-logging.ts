import type { Pattern } from "../../schema.js";

export const auditLogging: Pattern = {
  name: "Audit Logging",
  slug: "audit-logging",
  description:
    "Structured audit trail for compliance and debugging. Tracks user actions with immutable logs, actor identification, and resource tracking.",
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
import type { AuditEvent, AuditEventInput, AuditActor } from "./types";

// Pino logger configured for audit events
const logger = pino({
  name: "audit",
  level: "info",
  // Structured JSON output
  formatters: {
    level: (label) => ({ level: label }),
    bindings: () => ({}),
  },
  // Timestamp in ISO format
  timestamp: () => \`,"timestamp":"\${new Date().toISOString()}"\`,
});

// In-memory store for development (replace with database in production)
const auditStore: AuditEvent[] = [];

// Create and log an audit event
export async function audit(input: AuditEventInput): Promise<AuditEvent> {
  const event: AuditEvent = {
    id: randomUUID(),
    timestamp: new Date(),
    action: input.action,
    status: input.status ?? "success",
    actor: {
      id: input.actor.id,
      type: input.actor.type ?? "user",
      ...input.actor,
    },
    resource: input.resource,
    metadata: input.metadata,
    changes: input.changes,
  };

  // Log to pino (will output structured JSON)
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

  // Store event (replace with database insert)
  auditStore.push(event);

  // TODO: In production, insert into database
  // await db.auditEvent.create({ data: event });

  return event;
}

// Query audit events
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

  // Filter events (replace with database query)
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

  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const total = filtered.length;
  const events = filtered.slice(offset, offset + limit);

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
import { audit, type AuditEventInput } from "./logger";
import type { AuditAction, AuditActor } from "./types";

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
        content: `// Add to your Prisma schema for persistent audit logging

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
        path: ".env.example",
        content: `# No external dependencies required
# Audit logs are written using Pino (structured JSON)

# For production, consider:
# - Storing in PostgreSQL (via Prisma)
# - Streaming to a log aggregation service (Datadog, Axiom, etc.)
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "pino" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  devDependencies: {
    nextjs: [{ name: "pino-pretty", dev: true }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
