import type { Pattern } from "../../schema.js";

export const rbac: Pattern = {
  name: "RBAC Patterns",
  slug: "rbac",
  description:
    "Role-based access control implementation with type-safe permissions and middleware protection.",
  category: "auth",
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/permissions.ts",
        content: `// Define your roles and permissions
export const ROLES = {
  admin: "admin",
  editor: "editor",
  viewer: "viewer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Define what each role can do
export const PERMISSIONS = {
  // User management
  "users:read": [ROLES.admin, ROLES.editor, ROLES.viewer],
  "users:write": [ROLES.admin],
  "users:delete": [ROLES.admin],

  // Content management
  "content:read": [ROLES.admin, ROLES.editor, ROLES.viewer],
  "content:write": [ROLES.admin, ROLES.editor],
  "content:delete": [ROLES.admin, ROLES.editor],
  "content:publish": [ROLES.admin],

  // Settings
  "settings:read": [ROLES.admin, ROLES.editor],
  "settings:write": [ROLES.admin],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(role);
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}
`,
      },
      {
        path: "lib/auth-utils.ts",
        content: `import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission, type Permission, type Role } from "@/lib/permissions";

// Get the current user with role
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;

  return {
    ...session.user,
    role: (session.user as { role?: Role }).role ?? "viewer",
  };
}

// Check permission and redirect if unauthorized
export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user.role, permission)) {
    redirect("/unauthorized");
  }

  return user;
}

// Check permission without redirect (for conditional rendering)
export async function checkPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return hasPermission(user.role, permission);
}
`,
      },
      {
        path: "components/permission-gate.tsx",
        content: `"use client";

import { useSession } from "next-auth/react";
import { hasPermission, type Permission, type Role } from "@/lib/permissions";

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { data: session } = useSession();
  const role = (session?.user as { role?: Role })?.role ?? "viewer";

  if (!hasPermission(role, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Usage example:
// <PermissionGate permission="users:delete">
//   <DeleteButton />
// </PermissionGate>
`,
      },
      {
        path: "middleware.ts",
        content: `import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { hasPermission, type Permission, type Role } from "@/lib/permissions";

// Map routes to required permissions
const PROTECTED_ROUTES: Record<string, Permission> = {
  "/admin": "settings:write",
  "/admin/users": "users:read",
  "/admin/content": "content:read",
};

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const user = req.auth?.user as { role?: Role } | undefined;
  const role = user?.role ?? "viewer";

  // Check protected routes
  for (const [route, permission] of Object.entries(PROTECTED_ROUTES)) {
    if (path.startsWith(route)) {
      if (!req.auth) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      if (!hasPermission(role, permission)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
`,
      },
      {
        path: "app/unauthorized/page.tsx",
        content: `import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">403</h1>
        <p className="mt-2 text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
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
    nextjs: [],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
