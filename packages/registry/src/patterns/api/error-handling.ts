import type { Pattern } from "../../schema.js";

export const errorHandling: Pattern = {
  name: "Error Handling",
  slug: "error-handling",
  description:
    "Consistent API error handling with custom error classes, error boundaries, and structured error responses.",
  category: "api",
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/errors.ts",
        content: `// Custom error classes for type-safe error handling

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(\`\${resource} not found\`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    public details?: Record<string, string[]>
  ) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.details,
    };
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super("Too many requests", 429, "RATE_LIMITED");
    this.name = "RateLimitError";
  }
}
`,
      },
      {
        path: "lib/api/error-handler.ts",
        content: `import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { ZodError } from "zod";

interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Log the error (in production, send to error tracking service)
  console.error("API Error:", error);

  // Handle known error types
  if (error instanceof AppError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // Handle database errors (example with Prisma)
  if (error && typeof error === "object" && "code" in error) {
    const dbError = error as { code: string };

    if (dbError.code === "P2002") {
      return NextResponse.json(
        {
          error: "CONFLICT",
          message: "A record with this value already exists",
        },
        { status: 409 }
      );
    }

    if (dbError.code === "P2025") {
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          message: "Record not found",
        },
        { status: 404 }
      );
    }
  }

  // Generic error response (don't leak internal details)
  return NextResponse.json(
    {
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
    { status: 500 }
  );
}

// Higher-order function to wrap API handlers with error handling
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
`,
      },
      {
        path: "app/api/example/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/error-handler";
import { NotFoundError, ValidationError } from "@/lib/errors";

// Example API route with error handling
export const GET = withErrorHandler(async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    throw new ValidationError("Missing required parameter: id");
  }

  // Simulate database lookup
  const item = null; // await db.item.findUnique({ where: { id } });

  if (!item) {
    throw new NotFoundError("Item");
  }

  return NextResponse.json({ data: item });
});
`,
      },
      {
        path: "app/error.tsx",
        content: `"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error tracking service
    console.error("Page Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">
          {error.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
`,
      },
      {
        path: "app/global-error.tsx",
        content: `"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold">Something went wrong</h1>
            <button onClick={reset} className="mt-4 px-4 py-2 border rounded">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
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
    nextjs: [{ name: "zod" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
