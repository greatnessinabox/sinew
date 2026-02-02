import type { Pattern } from "../../schema.js";

export const corsConfig: Pattern = {
  name: "CORS Config",
  slug: "cors-config",
  description:
    "Configurable CORS setup for API routes. Includes origin validation, preflight handling, and credential support using Next.js middleware.",
  category: "security",
  frameworks: ["nextjs"],
  tier: "free",
  complexity: "beginner",
  tags: ["cors", "security", "api", "headers"],
  files: {
    nextjs: [
      {
        path: "lib/cors/config.ts",
        content: `// CORS Configuration
export interface CORSConfig {
  // Allowed origins (use '*' for any, or array of specific origins)
  allowedOrigins: string[] | "*";
  // Allowed HTTP methods
  allowedMethods: string[];
  // Allowed headers
  allowedHeaders: string[];
  // Exposed headers (headers client can access)
  exposedHeaders?: string[];
  // Allow credentials (cookies, auth headers)
  credentials?: boolean;
  // Preflight cache duration in seconds
  maxAge?: number;
}

// Default CORS configuration
export const defaultConfig: CORSConfig = {
  allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(",") ?? [
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "X-CSRF-Token",
  ],
  exposedHeaders: ["X-Request-Id", "X-RateLimit-Remaining"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Strict CORS for production APIs
export const strictConfig: CORSConfig = {
  allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(",") ?? [],
  allowedMethods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 3600, // 1 hour
};

// Open CORS for public APIs
export const publicConfig: CORSConfig = {
  allowedOrigins: "*",
  allowedMethods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: false,
  maxAge: 86400,
};

// Route-specific CORS configurations
export const routeConfigs: Record<string, CORSConfig> = {
  "/api/public": publicConfig,
  "/api/v1": defaultConfig,
  "/api/admin": strictConfig,
};
`,
      },
      {
        path: "lib/cors/middleware.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { defaultConfig, routeConfigs, type CORSConfig } from "./config";

// Check if origin is allowed
function isOriginAllowed(origin: string | null, config: CORSConfig): boolean {
  if (!origin) return false;
  if (config.allowedOrigins === "*") return true;
  return config.allowedOrigins.includes(origin);
}

// Get CORS config for a route
function getConfigForRoute(pathname: string): CORSConfig {
  // Check for route-specific config
  for (const [route, config] of Object.entries(routeConfigs)) {
    if (pathname.startsWith(route)) {
      return config;
    }
  }
  return defaultConfig;
}

// Apply CORS headers to response
export function applyCORSHeaders(
  response: NextResponse,
  origin: string,
  config: CORSConfig
): NextResponse {
  // Set origin
  if (config.allowedOrigins === "*") {
    response.headers.set("Access-Control-Allow-Origin", "*");
  } else if (config.allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }

  // Set credentials
  if (config.credentials) {
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Set exposed headers
  if (config.exposedHeaders?.length) {
    response.headers.set(
      "Access-Control-Expose-Headers",
      config.exposedHeaders.join(", ")
    );
  }

  return response;
}

// Handle preflight (OPTIONS) request
export function handlePreflight(
  origin: string,
  config: CORSConfig
): NextResponse {
  const response = new NextResponse(null, { status: 204 });

  // Set origin
  if (config.allowedOrigins === "*") {
    response.headers.set("Access-Control-Allow-Origin", "*");
  } else if (config.allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }

  // Set allowed methods
  response.headers.set(
    "Access-Control-Allow-Methods",
    config.allowedMethods.join(", ")
  );

  // Set allowed headers
  response.headers.set(
    "Access-Control-Allow-Headers",
    config.allowedHeaders.join(", ")
  );

  // Set credentials
  if (config.credentials) {
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Set max age
  if (config.maxAge) {
    response.headers.set("Access-Control-Max-Age", config.maxAge.toString());
  }

  return response;
}

// CORS middleware for Next.js
export function corsMiddleware(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  const pathname = request.nextUrl.pathname;

  // Only handle API routes
  if (!pathname.startsWith("/api")) {
    return null;
  }

  const config = getConfigForRoute(pathname);

  // Check origin
  if (origin && !isOriginAllowed(origin, config)) {
    return new NextResponse("CORS: Origin not allowed", { status: 403 });
  }

  // Handle preflight
  if (request.method === "OPTIONS") {
    return handlePreflight(origin ?? "", config);
  }

  // For actual requests, headers will be added by the route handler
  return null;
}

// Wrapper for API route handlers
export function withCORS(
  handler: (req: NextRequest) => Promise<Response>,
  config?: CORSConfig
) {
  return async (req: NextRequest): Promise<Response> => {
    const origin = req.headers.get("origin");
    const corsConfig = config ?? getConfigForRoute(req.nextUrl.pathname);

    // Handle preflight
    if (req.method === "OPTIONS") {
      return handlePreflight(origin ?? "", corsConfig);
    }

    // Check origin
    if (origin && !isOriginAllowed(origin, corsConfig)) {
      return new NextResponse("CORS: Origin not allowed", { status: 403 });
    }

    // Execute handler
    const response = await handler(req);

    // Apply CORS headers
    const corsResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    if (origin) {
      applyCORSHeaders(corsResponse, origin, corsConfig);
    }

    return corsResponse;
  };
}
`,
      },
      {
        path: "middleware.ts.example",
        content: `// Add CORS handling to your middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { corsMiddleware } from "@/lib/cors/middleware";

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    const corsResponse = corsMiddleware(request);
    if (corsResponse) {
      return corsResponse;
    }
  }

  // Continue with other middleware
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
`,
      },
      {
        path: "app/api/example/route.ts.example",
        content: `// Example API route with CORS wrapper

import { NextRequest, NextResponse } from "next/server";
import { withCORS } from "@/lib/cors/middleware";

async function handler(req: NextRequest) {
  return NextResponse.json({ message: "Hello, world!" });
}

// Wrap with CORS handling
export const GET = withCORS(handler);
export const POST = withCORS(handler);
export const OPTIONS = withCORS(handler);
`,
      },
      {
        path: "next.config.ts.example",
        content: `// Alternative: Configure CORS headers in next.config.ts
// This is simpler but less flexible than middleware

const nextConfig = {
  async headers() {
    return [
      {
        // Apply to all API routes
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            // Use specific origin in production
            value: process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
`,
      },
      {
        path: ".env.example",
        content: `# CORS Configuration
# Comma-separated list of allowed origins
CORS_ALLOWED_ORIGINS="https://your-domain.com,https://app.your-domain.com"

# For development, you might use:
# CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [], // Uses Next.js built-in features
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
