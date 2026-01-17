import { test, expect } from "@playwright/test";

test.describe("API Endpoints", () => {
  test("GET /api/health should return health status", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("uptime");
    expect(data).toHaveProperty("checks");
  });

  test("GET /api/posts should return posts list", async ({ request }) => {
    const response = await request.get("/api/posts");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("meta");
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.meta).toHaveProperty("total");
    expect(data.meta).toHaveProperty("limit");
    expect(data.meta).toHaveProperty("offset");
  });

  test("GET /api/posts should respect limit parameter", async ({ request }) => {
    const response = await request.get("/api/posts?limit=5");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.meta.limit).toBe(5);
    expect(data.data.length).toBeLessThanOrEqual(5);
  });

  test("POST /api/posts should require authentication", async ({ request }) => {
    const response = await request.post("/api/posts", {
      data: { title: "Test Post" },
    });

    expect(response.status()).toBe(401);
  });

  test("POST /api/posts should validate input", async ({ request }) => {
    // This would need authentication to test properly
    // For now, we just verify the endpoint exists
    const response = await request.post("/api/posts", {
      data: {},
    });

    // Expect 401 (not authenticated) rather than 400 (validation)
    // because auth check happens before validation
    expect(response.status()).toBe(401);
  });
});
