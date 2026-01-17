export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Protected routes
    "/dashboard/:path*",
    "/admin/:path*",
    // Skip static files and API routes that handle their own auth
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
