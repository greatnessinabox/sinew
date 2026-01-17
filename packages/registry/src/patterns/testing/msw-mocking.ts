import type { Pattern } from "../../schema.js";

export const mswMocking: Pattern = {
  name: "MSW Mocking",
  slug: "msw-mocking",
  description:
    "API mocking with Mock Service Worker. Mock REST and GraphQL APIs in tests and development.",
  category: "testing",
  tier: "free",
  complexity: "intermediate",
  tags: ["testing", "mocking", "msw", "api"],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "mocks/handlers.ts",
        content: `import { http, HttpResponse, graphql } from "msw";

// Define your API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";

// Types for your API responses
interface User {
  id: string;
  name: string;
  email: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

// Mock data
const mockUsers: User[] = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
];

const mockPosts: Post[] = [
  { id: "1", title: "First Post", content: "Hello World", authorId: "1" },
  { id: "2", title: "Second Post", content: "Another post", authorId: "2" },
];

// REST API handlers
export const restHandlers = [
  // GET /api/users
  http.get(\`\${API_URL}/api/users\`, () => {
    return HttpResponse.json(mockUsers);
  }),

  // GET /api/users/:id
  http.get<{ id: string }>(\`\${API_URL}/api/users/:id\`, ({ params }) => {
    const user = mockUsers.find((u) => u.id === params.id);
    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(user);
  }),

  // POST /api/users
  http.post(\`\${API_URL}/api/users\`, async ({ request }) => {
    const body = (await request.json()) as Omit<User, "id">;
    const newUser: User = {
      id: String(mockUsers.length + 1),
      ...body,
    };
    return HttpResponse.json(newUser, { status: 201 });
  }),

  // GET /api/posts
  http.get(\`\${API_URL}/api/posts\`, ({ request }) => {
    const url = new URL(request.url);
    const authorId = url.searchParams.get("authorId");

    if (authorId) {
      const filteredPosts = mockPosts.filter((p) => p.authorId === authorId);
      return HttpResponse.json(filteredPosts);
    }

    return HttpResponse.json(mockPosts);
  }),

  // Error simulation handler
  http.get(\`\${API_URL}/api/error\`, () => {
    return HttpResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }),

  // Delayed response handler
  http.get(\`\${API_URL}/api/slow\`, async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return HttpResponse.json({ message: "Slow response" });
  }),
];

// GraphQL handlers
export const graphqlHandlers = [
  graphql.query("GetUsers", () => {
    return HttpResponse.json({
      data: {
        users: mockUsers,
      },
    });
  }),

  graphql.query("GetUser", ({ variables }) => {
    const user = mockUsers.find((u) => u.id === variables.id);
    return HttpResponse.json({
      data: {
        user: user || null,
      },
    });
  }),

  graphql.mutation("CreateUser", ({ variables }) => {
    const newUser: User = {
      id: String(mockUsers.length + 1),
      name: variables.name,
      email: variables.email,
    };
    return HttpResponse.json({
      data: {
        createUser: newUser,
      },
    });
  }),
];

// Combined handlers
export const handlers = [...restHandlers, ...graphqlHandlers];
`,
      },
      {
        path: "mocks/server.ts",
        content: `import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Create the server instance for Node.js environment (tests, SSR)
export const server = setupServer(...handlers);

// Server lifecycle helpers for tests
export function setupMockServer() {
  // Start server before all tests
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
  });

  // Reset handlers after each test
  afterEach(() => {
    server.resetHandlers();
  });

  // Close server after all tests
  afterAll(() => {
    server.close();
  });
}
`,
      },
      {
        path: "mocks/browser.ts",
        content: `import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Create the worker instance for browser environment (development)
export const worker = setupWorker(...handlers);

// Start the worker with custom options
export async function startMockServiceWorker() {
  if (typeof window === "undefined") {
    return;
  }

  return worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
  });
}
`,
      },
      {
        path: "mocks/index.ts",
        content: `// Re-export handlers for custom test scenarios
export { handlers, restHandlers, graphqlHandlers } from "./handlers";

// Environment-specific exports
export { server, setupMockServer } from "./server";
export { worker, startMockServiceWorker } from "./browser";
`,
      },
      {
        path: "tests/msw-setup.ts",
        content: `import { setupMockServer } from "../mocks/server";

// Initialize MSW server for all tests
setupMockServer();
`,
      },
      {
        path: "tests/api.test.ts",
        content: `import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

// Import your actual API client or fetch wrapper
// import { apiClient } from "@/lib/api-client";

// Example API client for demonstration
async function fetchUsers() {
  const response = await fetch("https://api.example.com/api/users");
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

async function fetchUser(id: string) {
  const response = await fetch(\`https://api.example.com/api/users/\${id}\`);
  if (!response.ok) throw new Error("Failed to fetch user");
  return response.json();
}

async function createUser(data: { name: string; email: string }) {
  const response = await fetch("https://api.example.com/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create user");
  return response.json();
}

describe("API with MSW", () => {
  describe("GET /api/users", () => {
    it("fetches all users", async () => {
      const users = await fetchUsers();

      expect(users).toHaveLength(2);
      expect(users[0]).toHaveProperty("id");
      expect(users[0]).toHaveProperty("name");
      expect(users[0]).toHaveProperty("email");
    });

    it("handles custom response for specific test", async () => {
      // Override the default handler for this specific test
      server.use(
        http.get("https://api.example.com/api/users", () => {
          return HttpResponse.json([
            { id: "test-1", name: "Test User", email: "test@example.com" },
          ]);
        })
      );

      const users = await fetchUsers();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe("Test User");
    });
  });

  describe("GET /api/users/:id", () => {
    it("fetches a single user", async () => {
      const user = await fetchUser("1");

      expect(user.id).toBe("1");
      expect(user.name).toBe("John Doe");
    });

    it("handles user not found", async () => {
      server.use(
        http.get("https://api.example.com/api/users/:id", () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      await expect(fetchUser("999")).rejects.toThrow("Failed to fetch user");
    });
  });

  describe("POST /api/users", () => {
    it("creates a new user", async () => {
      const newUser = await createUser({
        name: "New User",
        email: "new@example.com",
      });

      expect(newUser.id).toBeDefined();
      expect(newUser.name).toBe("New User");
      expect(newUser.email).toBe("new@example.com");
    });
  });

  describe("Error handling", () => {
    it("handles network errors", async () => {
      server.use(
        http.get("https://api.example.com/api/users", () => {
          return HttpResponse.error();
        })
      );

      await expect(fetchUsers()).rejects.toThrow();
    });

    it("handles server errors", async () => {
      server.use(
        http.get("https://api.example.com/api/users", () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      await expect(fetchUsers()).rejects.toThrow("Failed to fetch users");
    });
  });
});
`,
      },
      {
        path: "app/providers.tsx",
        content: `"use client";

import { useEffect, useState } from "react";

// Provider component for MSW in development
export function MockProvider({ children }: { children: React.ReactNode }) {
  const [isMockReady, setIsMockReady] = useState(false);

  useEffect(() => {
    async function enableMocking() {
      if (process.env.NODE_ENV !== "development") {
        setIsMockReady(true);
        return;
      }

      // Only enable MSW if NEXT_PUBLIC_ENABLE_MSW is set
      if (process.env.NEXT_PUBLIC_ENABLE_MSW !== "true") {
        setIsMockReady(true);
        return;
      }

      const { startMockServiceWorker } = await import("../mocks/browser");
      await startMockServiceWorker();
      setIsMockReady(true);
    }

    enableMocking();
  }, []);

  // Show nothing until mocks are ready to avoid hydration issues
  if (!isMockReady) {
    return null;
  }

  return <>{children}</>;
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
    nextjs: [],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  devDependencies: {
    nextjs: [{ name: "msw", dev: true }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
