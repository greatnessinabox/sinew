import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Using standalone output for Docker deployments
  output: "standalone",

  // Strict mode for better development experience
  reactStrictMode: true,

  // Type-safe routes (moved from experimental in Next.js 16)
  typedRoutes: true,

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
