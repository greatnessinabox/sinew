import type { Pattern } from "../../schema.js";

export const apiValidation: Pattern = {
  name: "API Validation",
  slug: "api-validation",
  description:
    "Type-safe API request/response validation with Zod. Includes reusable validation middleware and error handling.",
  category: "api",
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/api/validation.ts",
        content: `import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

// Type-safe API error response
export interface ApiError {
  error: string;
  message: string;
  details?: z.ZodIssue[];
}

// Validate request body against a Zod schema
export async function validateBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: ApiError }> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        data: null,
        error: {
          error: "Validation Error",
          message: "Invalid request body",
          details: err.issues,
        },
      };
    }
    return {
      data: null,
      error: {
        error: "Parse Error",
        message: "Invalid JSON body",
      },
    };
  }
}

// Validate query parameters against a Zod schema
export function validateQuery<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): { data: z.infer<T>; error: null } | { data: null; error: ApiError } {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const data = schema.parse(params);
    return { data, error: null };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        data: null,
        error: {
          error: "Validation Error",
          message: "Invalid query parameters",
          details: err.issues,
        },
      };
    }
    throw err;
  }
}

// Create a validated API handler
export function createApiHandler<
  TBody extends z.ZodType = z.ZodNever,
  TQuery extends z.ZodType = z.ZodNever,
  TResponse = unknown
>(config: {
  body?: TBody;
  query?: TQuery;
  handler: (params: {
    body: z.infer<TBody>;
    query: z.infer<TQuery>;
    req: NextRequest;
  }) => Promise<TResponse>;
}) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Validate body if schema provided
      let body: z.infer<TBody> | undefined;
      if (config.body) {
        const result = await validateBody(req, config.body);
        if (result.error) {
          return NextResponse.json(result.error, { status: 400 });
        }
        body = result.data;
      }

      // Validate query if schema provided
      let query: z.infer<TQuery> | undefined;
      if (config.query) {
        const result = validateQuery(req, config.query);
        if (result.error) {
          return NextResponse.json(result.error, { status: 400 });
        }
        query = result.data;
      }

      // Call the handler
      const response = await config.handler({
        body: body as z.infer<TBody>,
        query: query as z.infer<TQuery>,
        req,
      });

      return NextResponse.json(response);
    } catch (err) {
      console.error("API Error:", err);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "An unexpected error occurred",
        },
        { status: 500 }
      );
    }
  };
}
`,
      },
      {
        path: "lib/api/schemas.ts",
        content: `import { z } from "zod";

// Common reusable schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(100).optional(),
  ...paginationSchema.shape,
});

// Example: User schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(["admin", "user"]).default("user"),
});

export const updateUserSchema = createUserSchema.partial();

// Export types
export type Pagination = z.infer<typeof paginationSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
`,
      },
      {
        path: "app/api/users/route.ts",
        content: `import { createApiHandler } from "@/lib/api/validation";
import { createUserSchema, paginationSchema } from "@/lib/api/schemas";

// GET /api/users - List users with pagination
export const GET = createApiHandler({
  query: paginationSchema,
  handler: async ({ query }) => {
    // query is typed as { page: number; limit: number }
    const { page, limit } = query;

    // Your database query here
    const users = []; // await db.user.findMany({ skip: (page - 1) * limit, take: limit });
    const total = 0; // await db.user.count();

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
});

// POST /api/users - Create user
export const POST = createApiHandler({
  body: createUserSchema,
  handler: async ({ body }) => {
    // body is typed as { email: string; name: string; role: "admin" | "user" }
    const { email, name, role } = body;

    // Your database insert here
    const user = { id: "1", email, name, role }; // await db.user.create({ data: body });

    return { data: user };
  },
});
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
