import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth configuration for middleware.
 *
 * IMPORTANT: This config must NOT include OAuth providers with secrets
 * because they use the Node.js crypto module which isn't available in
 * the Edge runtime. The middleware only needs to check session validity,
 * not perform authentication - that happens via the full config in auth.ts.
 */
export const authConfig = {
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");

      if (isOnAdmin) {
        return isLoggedIn;
      }

      if (isOnDashboard) {
        return isLoggedIn;
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;
