import type { Pattern } from "../../schema.js";

export const sessions: Pattern = {
  name: "Session Management",
  slug: "sessions",
  description:
    "Secure session handling with database storage, automatic expiration, and device tracking.",
  category: "auth",
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/session.ts",
        content: `import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

const SESSION_COOKIE = "session_id";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
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
      userAgent: options?.userAgent,
      ipAddress: options?.ipAddress,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
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
    if (session) {
      await db.session.delete({ where: { id: sessionId } });
    }
    return null;
  }

  return session;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await db.session.delete({ where: { id: sessionId } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function refreshSession(): Promise<Session | null> {
  const session = await getSession();
  if (!session) return null;

  const newExpiresAt = new Date(Date.now() + SESSION_DURATION);

  const updated = await db.session.update({
    where: { id: session.id },
    data: { expiresAt: newExpiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: newExpiresAt,
    path: "/",
  });

  return updated;
}

export async function getUserSessions(userId: string): Promise<Session[]> {
  return db.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}
`,
      },
      {
        path: "prisma/schema.prisma",
        content: `// Add this model to your existing Prisma schema

model Session {
  id        String   @id
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  userAgent String?
  ipAddress String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
`,
      },
      {
        path: "app/api/sessions/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { getSession, getUserSessions, revokeAllSessions } from "@/lib/session";

// GET /api/sessions - List all sessions for current user
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await getUserSessions(session.userId);
  return NextResponse.json(sessions);
}

// DELETE /api/sessions - Revoke all sessions
export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await revokeAllSessions(session.userId);
  return NextResponse.json({ success: true });
}
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "nanoid" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
