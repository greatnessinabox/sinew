import type { Pattern } from "../../schema.js";

export const vercel: Pattern = {
  name: "Vercel Config",
  slug: "vercel",
  description:
    "Vercel deployment configuration with edge functions, environment setup, and build optimizations.",
  category: "deployment",
  tier: "free",
  complexity: "beginner",
  tags: ["deployment", "vercel", "edge", "serverless"],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "vercel.json",
        content: `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 0 * * *"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/sitemap.xml",
      "destination": "/api/sitemap"
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ]
}
`,
      },
      {
        path: "app/api/cron/daily/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";

// Verify the request is from Vercel Cron
function isValidCronRequest(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  return authHeader === \`Bearer \${process.env.CRON_SECRET}\`;
}

export async function GET(req: NextRequest) {
  // Verify cron secret in production
  if (process.env.NODE_ENV === "production" && !isValidCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Add your daily cron job logic here
    console.log("Running daily cron job at", new Date().toISOString());

    // Example tasks:
    // - Clean up expired sessions
    // - Send scheduled emails
    // - Generate daily reports
    // - Sync external data

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: "middleware.ts",
        content: `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge middleware for request handling
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add request ID for tracing
  const requestId = crypto.randomUUID();
  response.headers.set("x-request-id", requestId);

  // Add timing header
  response.headers.set("x-middleware-timestamp", Date.now().toString());

  // Geo-based routing example
  const country = request.geo?.country || "US";
  response.headers.set("x-user-country", country);

  // Bot detection (basic)
  const userAgent = request.headers.get("user-agent") || "";
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent);
  response.headers.set("x-is-bot", isBot.toString());

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all paths except static files and api routes you want to exclude
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
`,
      },
      {
        path: "lib/edge.ts",
        content: `import { NextRequest } from "next/server";

/**
 * Edge-compatible utilities for Vercel Edge Functions
 */

// Simple in-memory rate limiter for edge (use Redis/Upstash for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function edgeRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: record.resetTime };
  }

  record.count++;
  return { success: true, remaining: limit - record.count, reset: record.resetTime };
}

// Get client IP from request
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Get geo information from Vercel
export function getGeoInfo(request: NextRequest) {
  return {
    country: request.geo?.country || null,
    city: request.geo?.city || null,
    region: request.geo?.region || null,
    latitude: request.geo?.latitude || null,
    longitude: request.geo?.longitude || null,
  };
}

// Parse and validate JSON body at the edge
export async function parseJsonBody<T>(
  request: NextRequest
): Promise<{ data: T | null; error: string | null }> {
  try {
    const body = await request.json();
    return { data: body as T, error: null };
  } catch {
    return { data: null, error: "Invalid JSON body" };
  }
}

// Create a response with common headers
export function edgeResponse(
  data: unknown,
  status: number = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}
`,
      },
      {
        path: "next.config.ts",
        content: `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize for Vercel deployment
  output: "standalone",

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.vercel.app",
      },
      {
        protocol: "https",
        hostname: "**.vercel-storage.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Optimize package imports
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
`,
      },
      {
        path: ".env.example",
        content: `# Vercel Environment Variables
# These are automatically set by Vercel:
# - VERCEL (true when deployed)
# - VERCEL_ENV (production, preview, or development)
# - VERCEL_URL (deployment URL without protocol)
# - VERCEL_REGION (e.g., iad1, sfo1)

# Application URL (set in Vercel dashboard)
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# Cron secret for verifying cron job requests
# Generate with: openssl rand -base64 32
CRON_SECRET="your-cron-secret"

# Database (use serverless-friendly options)
# Vercel Postgres: postgres://...
# PlanetScale: mysql://...
# Neon: postgres://...
DATABASE_URL="postgres://..."

# Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=""
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
