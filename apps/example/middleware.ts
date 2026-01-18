import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use edge-compatible auth config (no database adapter)
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    // Protected routes
    "/dashboard/:path*",
    "/admin/:path*",
    // Skip static files and API routes that handle their own auth
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
