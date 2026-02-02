import type { Pattern } from "../../schema.js";

export const csrfProtection: Pattern = {
  name: "CSRF Protection",
  slug: "csrf-protection",
  description:
    "Cross-Site Request Forgery protection for form submissions. Uses secure tokens with Web Crypto API, no external dependencies required.",
  category: "security",
  frameworks: ["nextjs"],
  tier: "free",
  complexity: "beginner",
  tags: ["csrf", "security", "forms", "tokens"],
  files: {
    nextjs: [
      {
        path: "lib/csrf/tokens.ts",
        content: `import { cookies } from "next/headers";

// CSRF token configuration
const CSRF_TOKEN_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32; // 256 bits

// Generate a random token using Web Crypto API
async function generateToken(): Promise<string> {
  const buffer = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Create or get CSRF token (server-side)
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (!token) {
    token = await generateToken();
    // Token will be set by the API route
  }

  return token;
}

// Set CSRF token cookie
export async function setCSRFCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

// Validate CSRF token from request
export async function validateCSRFToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (!cookieToken) {
    return false;
  }

  // Check header first, then body
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (headerToken) {
    return timingSafeEqual(cookieToken, headerToken);
  }

  // For form submissions, check body
  const contentType = request.headers.get("content-type");
  if (contentType?.includes("application/x-www-form-urlencoded")) {
    const formData = await request.clone().formData();
    const bodyToken = formData.get("_csrf")?.toString();
    if (bodyToken) {
      return timingSafeEqual(cookieToken, bodyToken);
    }
  }

  if (contentType?.includes("application/json")) {
    const body = await request.clone().json();
    const bodyToken = body._csrf;
    if (bodyToken) {
      return timingSafeEqual(cookieToken, bodyToken);
    }
  }

  return false;
}

// Timing-safe string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }

  return result === 0;
}

// Delete CSRF token (on logout)
export async function clearCSRFToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_TOKEN_NAME);
}
`,
      },
      {
        path: "lib/csrf/middleware.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { validateCSRFToken } from "./tokens";

// Methods that modify state and need CSRF protection
const PROTECTED_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

// Middleware to validate CSRF tokens
export function withCSRFProtection(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    // Only check protected methods
    if (PROTECTED_METHODS.includes(req.method)) {
      const isValid = await validateCSRFToken(req);

      if (!isValid) {
        return NextResponse.json(
          {
            error: "CSRF validation failed",
            message: "Invalid or missing CSRF token",
          },
          { status: 403 }
        );
      }
    }

    return handler(req);
  };
}

// Edge middleware for CSRF (add to middleware.ts)
export async function csrfMiddleware(request: NextRequest) {
  // Skip CSRF check for safe methods and API routes that handle their own
  if (
    !PROTECTED_METHODS.includes(request.method) ||
    request.nextUrl.pathname.startsWith("/api/webhooks") ||
    request.nextUrl.pathname.startsWith("/api/public")
  ) {
    return NextResponse.next();
  }

  const isValid = await validateCSRFToken(request);

  if (!isValid) {
    return NextResponse.json(
      { error: "CSRF validation failed" },
      { status: 403 }
    );
  }

  return NextResponse.next();
}
`,
      },
      {
        path: "components/csrf-input.tsx",
        content: `"use client";

import { useEffect, useState } from "react";

interface CSRFInputProps {
  name?: string;
}

// Hidden input for CSRF token in forms
export function CSRFInput({ name = "_csrf" }: CSRFInputProps) {
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    // Fetch token from API
    fetch("/api/csrf")
      .then((res) => res.json())
      .then((data) => setToken(data.token))
      .catch(console.error);
  }, []);

  return <input type="hidden" name={name} value={token} />;
}

// Hook to get CSRF token for programmatic use
export function useCSRFToken() {
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/csrf")
      .then((res) => res.json())
      .then((data) => {
        setToken(data.token);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch CSRF token:", error);
        setIsLoading(false);
      });
  }, []);

  return { token, isLoading };
}

// Wrapper for fetch that includes CSRF token
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get token
  const tokenResponse = await fetch("/api/csrf");
  const { token } = await tokenResponse.json();

  // Add token to headers
  const headers = new Headers(options.headers);
  headers.set("x-csrf-token", token);

  return fetch(url, {
    ...options,
    headers,
  });
}
`,
      },
      {
        path: "app/api/csrf/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { getCSRFToken, setCSRFCookie } from "@/lib/csrf/tokens";

// Get CSRF token
export async function GET() {
  const token = await getCSRFToken();
  await setCSRFCookie(token);

  return NextResponse.json({ token });
}
`,
      },
      {
        path: "app/example-form.tsx.example",
        content: `// Example form with CSRF protection

import { CSRFInput } from "@/components/csrf-input";

export default function ExampleForm() {
  return (
    <form action="/api/submit" method="POST">
      {/* CSRF token is automatically included */}
      <CSRFInput />

      <label>
        Name:
        <input type="text" name="name" required />
      </label>

      <label>
        Email:
        <input type="email" name="email" required />
      </label>

      <button type="submit">Submit</button>
    </form>
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
    nextjs: [], // Uses Web Crypto API (built-in)
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
