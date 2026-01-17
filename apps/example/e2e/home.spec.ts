import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should display the homepage", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Sinew Example App/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sinew Example App");
  });

  test("should show sign in button when not authenticated", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("should show feature cards", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Authentication")).toBeVisible();
    await expect(page.getByText("Database")).toBeVisible();
    await expect(page.getByText("API Validation")).toBeVisible();
    await expect(page.getByText("Type-Safe Env")).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /sign in/i }).click();

    await expect(page).toHaveURL("/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
  });
});
