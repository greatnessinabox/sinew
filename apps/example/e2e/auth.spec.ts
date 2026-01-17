import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show login page with OAuth providers", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with github/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
  });

  test("should redirect to login when accessing dashboard without auth", async ({ page }) => {
    await page.goto("/dashboard");

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });

  test("login page should show terms notice", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText(/terms of service/i)).toBeVisible();
  });
});
