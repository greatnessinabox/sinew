import type { Pattern } from "../../schema.js";

export const playwrightE2e: Pattern = {
  name: "Playwright E2E",
  slug: "playwright-e2e",
  description:
    "End-to-end testing with Playwright. Includes page object pattern, authentication helpers, and CI configuration.",
  category: "testing",
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "playwright.config.ts",
        content: `import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile viewports
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
`,
      },
      {
        path: "e2e/fixtures/base.ts",
        content: `import { test as base, expect } from "@playwright/test";

// Extend base test with custom fixtures
export const test = base.extend<{
  // Add custom fixtures here
}>({
  // Example: Auto-login fixture
  // authenticatedPage: async ({ page }, use) => {
  //   await page.goto("/login");
  //   await page.fill('[name="email"]', "test@example.com");
  //   await page.fill('[name="password"]', "password");
  //   await page.click('button[type="submit"]');
  //   await page.waitForURL("/dashboard");
  //   await use(page);
  // },
});

export { expect };
`,
      },
      {
        path: "e2e/pages/home.page.ts",
        content: `import { Page, Locator } from "@playwright/test";

// Page Object Model for the home page
export class HomePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly ctaButton: Locator;
  readonly navLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.ctaButton = page.getByRole("link", { name: /get started/i });
    this.navLinks = page.getByRole("navigation").getByRole("link");
  }

  async goto() {
    await this.page.goto("/");
  }

  async clickCta() {
    await this.ctaButton.click();
  }

  async getNavLinkCount() {
    return this.navLinks.count();
  }
}
`,
      },
      {
        path: "e2e/home.spec.ts",
        content: `import { test, expect } from "./fixtures/base";
import { HomePage } from "./pages/home.page";

test.describe("Home Page", () => {
  test("has correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Sinew/);
  });

  test("displays main heading", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.heading).toBeVisible();
  });

  test("navigation links are visible", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const linkCount = await homePage.getNavLinkCount();
    expect(linkCount).toBeGreaterThan(0);
  });

  test("CTA button navigates to patterns", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.clickCta();
    await expect(page).toHaveURL(/patterns/);
  });
});

test.describe("Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("mobile menu works", async ({ page }) => {
    await page.goto("/");
    // Add mobile-specific tests here
  });
});
`,
      },
      {
        path: "e2e/auth.spec.ts",
        content: `import { test, expect } from "./fixtures/base";

test.describe("Authentication", () => {
  test("redirects unauthenticated users from protected routes", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test("shows login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /github/i })).toBeVisible();
  });

  // Example: Test with authenticated state
  // test("authenticated user can access dashboard", async ({ authenticatedPage }) => {
  //   await authenticatedPage.goto("/dashboard");
  //   await expect(authenticatedPage).toHaveURL("/dashboard");
  // });
});
`,
      },
      {
        path: ".github/workflows/e2e.yml",
        content: `name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build app
        run: npm run build

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test results
        uses: actions/upload-artifact@v6
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
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
    nextjs: [{ name: "@playwright/test", dev: true }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
