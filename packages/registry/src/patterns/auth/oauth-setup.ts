import type { Pattern } from "../../schema.js";

export const oauthSetup: Pattern = {
  name: "OAuth Setup",
  slug: "oauth-setup",
  description:
    "Production-ready OAuth authentication with Auth.js (NextAuth v5). Includes GitHub and Google providers with database session storage.",
  category: "auth",
  tier: "free",
  complexity: "intermediate",
  tags: ["auth", "oauth", "nextauth", "session", "github", "google"],
  alternatives: [
    {
      name: "Clerk",
      description:
        "Drop-in authentication with pre-built UI components, user management, and webhooks",
      url: "https://clerk.com",
      pricingTier: "freemium",
      pricingNote: "Free for 10,000 MAU, then $0.02/MAU",
      advantages: [
        "Pre-built sign-in/sign-up UI components",
        "User management dashboard included",
        "Built-in MFA, social login, and magic links",
        "No database setup required",
        "Webhooks for user events",
      ],
      recommended: true,
    },
    {
      name: "Auth0",
      description: "Enterprise-grade identity platform with extensive customization",
      url: "https://auth0.com",
      pricingTier: "freemium",
      pricingNote: "Free for 7,500 MAU",
      advantages: [
        "Enterprise SSO (SAML, OIDC)",
        "Extensive compliance certifications (SOC2, HIPAA)",
        "Advanced security features (brute force protection, breached password detection)",
        "Highly customizable login flows",
      ],
    },
    {
      name: "Kinde",
      description: "Modern auth platform with great DX and generous free tier",
      url: "https://kinde.com",
      pricingTier: "freemium",
      pricingNote: "Free for 10,500 MAU",
      advantages: [
        "Simple setup with great documentation",
        "Feature flags included",
        "B2B multi-tenancy support",
        "Generous free tier",
      ],
    },
  ],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/auth.ts",
        content: `import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      return true;
    },
  },
});
`,
      },
      {
        path: "app/api/auth/[...nextauth]/route.ts",
        content: `import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
`,
      },
      {
        path: "middleware.ts",
        content: `import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard");

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "next-auth", version: "^5.0.0-beta.25" }, { name: "@auth/prisma-adapter" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
