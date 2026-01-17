import type { Pattern } from "../../schema.js";

export const vitestSetup: Pattern = {
  name: "Vitest Setup",
  slug: "vitest-setup",
  description:
    "Unit and integration testing with Vitest. Includes React Testing Library, mocking utilities, and coverage configuration.",
  category: "testing",
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "vitest.config.ts",
        content: `import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types/*",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
`,
      },
      {
        path: "tests/setup.ts",
        content: `import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));
`,
      },
      {
        path: "tests/utils.tsx",
        content: `import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";

// Add any providers your app needs here
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
export { customRender as render };
`,
      },
      {
        path: "tests/example.test.tsx",
        content: `import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "./utils";

// Example component for testing
function Counter({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}

import { useState } from "react";

describe("Counter", () => {
  it("renders with initial count", () => {
    render(<Counter initialCount={5} />);
    expect(screen.getByTestId("count")).toHaveTextContent("5");
  });

  it("increments count when button is clicked", () => {
    render(<Counter />);
    const button = screen.getByRole("button", { name: /increment/i });

    fireEvent.click(button);

    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });
});

// Example: Testing a hook
import { renderHook, act } from "@testing-library/react";

function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  return { count, increment, decrement };
}

describe("useCounter", () => {
  it("initializes with the given value", () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it("increments the count", () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});

// Example: Testing async functions
describe("Async operations", () => {
  it("handles async data fetching", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ id: 1, name: "Test" });

    const data = await mockFetch();

    expect(data).toEqual({ id: 1, name: "Test" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
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
    nextjs: [],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  devDependencies: {
    nextjs: [
      { name: "vitest", dev: true },
      { name: "@vitejs/plugin-react", dev: true },
      { name: "@testing-library/react", dev: true },
      { name: "@testing-library/jest-dom", dev: true },
      { name: "jsdom", dev: true },
      { name: "@vitest/coverage-v8", dev: true },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
