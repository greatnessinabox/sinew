import type { Pattern } from "../../schema.js";

export const componentTesting: Pattern = {
  name: "Component Testing",
  slug: "component-testing",
  description:
    "React component testing with Testing Library. Includes custom render, user events, and accessibility testing.",
  category: "testing",
  tier: "free",
  complexity: "beginner",
  tags: ["testing", "react", "testing-library", "components"],
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "tests/test-utils.tsx",
        content: `import { ReactElement, ReactNode } from "react";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Add your app providers here
interface ProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: ProvidersProps) {
  // Wrap with any providers your app needs (e.g., ThemeProvider, QueryClientProvider)
  return <>{children}</>;
}

// Custom render function that includes providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Setup user event instance with sensible defaults
function setupUser() {
  return userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
  });
}

// Combined render function that returns both render result and user event
function renderWithUser(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return {
    user: setupUser(),
    ...customRender(ui, options),
  };
}

// Re-export everything from testing library
export * from "@testing-library/react";
export { customRender as render, renderWithUser, setupUser };

// Import vi for timer mocking
import { vi } from "vitest";
`,
      },
      {
        path: "tests/components/Button.test.tsx",
        content: `import { describe, it, expect, vi } from "vitest";
import { render, screen, renderWithUser } from "../test-utils";

// Example Button component for demonstration
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

function Button({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  loading = false,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-variant={variant}
      aria-busy={loading}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}

describe("Button", () => {
  describe("rendering", () => {
    it("renders children correctly", () => {
      render(<Button>Click me</Button>);

      expect(
        screen.getByRole("button", { name: /click me/i })
      ).toBeInTheDocument();
    });

    it("renders with different variants", () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole("button")).toHaveAttribute(
        "data-variant",
        "primary"
      );

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole("button")).toHaveAttribute(
        "data-variant",
        "danger"
      );
    });

    it("shows loading state", () => {
      render(<Button loading>Submit</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Loading...");
      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button).toBeDisabled();
    });
  });

  describe("interactions", () => {
    it("calls onClick when clicked", async () => {
      const handleClick = vi.fn();
      const { user } = renderWithUser(<Button onClick={handleClick}>Click</Button>);

      await user.click(screen.getByRole("button"));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled", async () => {
      const handleClick = vi.fn();
      const { user } = renderWithUser(
        <Button onClick={handleClick} disabled>
          Click
        </Button>
      );

      await user.click(screen.getByRole("button"));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("can be focused with keyboard", async () => {
      const { user } = renderWithUser(<Button>Focus me</Button>);

      await user.tab();

      expect(screen.getByRole("button")).toHaveFocus();
    });

    it("can be activated with keyboard", async () => {
      const handleClick = vi.fn();
      const { user } = renderWithUser(<Button onClick={handleClick}>Press</Button>);

      await user.tab();
      await user.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility", () => {
    it("has correct button role", () => {
      render(<Button>Accessible</Button>);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("is disabled when loading", () => {
      render(<Button loading>Loading</Button>);

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("supports custom aria attributes", () => {
      render(<Button aria-label="Custom label">Icon</Button>);

      expect(screen.getByRole("button", { name: "Custom label" })).toBeInTheDocument();
    });
  });
});
`,
      },
      {
        path: "tests/components/Form.test.tsx",
        content: `import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { screen, waitFor, renderWithUser } from "../test-utils";

// Example Form component for demonstration
interface FormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (data: FormData) => Promise<void>;
}

function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Login form">
      {error && (
        <div role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-required="true"
        autoComplete="email"
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-required="true"
        autoComplete="current-password"
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

describe("LoginForm", () => {
  describe("rendering", () => {
    it("renders form fields", () => {
      renderWithUser(<LoginForm onSubmit={vi.fn()} />);

      expect(screen.getByRole("form", { name: /login/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("shows error when submitting empty form", async () => {
      const { user } = renderWithUser(<LoginForm onSubmit={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please fill in all fields"
      );
    });

    it("shows error when only email is provided", async () => {
      const { user } = renderWithUser(<LoginForm onSubmit={vi.fn()} />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please fill in all fields"
      );
    });
  });

  describe("submission", () => {
    it("submits form with valid data", async () => {
      const handleSubmit = vi.fn().mockResolvedValue(undefined);
      const { user } = renderWithUser(<LoginForm onSubmit={handleSubmit} />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("shows loading state during submission", async () => {
      const handleSubmit = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const { user } = renderWithUser(<LoginForm onSubmit={handleSubmit} />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(screen.getByRole("button")).toHaveTextContent("Signing in...");
      expect(screen.getByRole("button")).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByRole("button")).toHaveTextContent("Sign in");
      });
    });

    it("shows error on submission failure", async () => {
      const handleSubmit = vi.fn().mockRejectedValue(new Error("Invalid credentials"));
      const { user } = renderWithUser(<LoginForm onSubmit={handleSubmit} />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrong-password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
      });
    });
  });

  describe("keyboard navigation", () => {
    it("allows form submission with Enter key", async () => {
      const handleSubmit = vi.fn().mockResolvedValue(undefined);
      const { user } = renderWithUser(<LoginForm onSubmit={handleSubmit} />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });

    it("moves focus between fields with Tab", async () => {
      const { user } = renderWithUser(<LoginForm onSubmit={vi.fn()} />);

      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button")).toHaveFocus();
    });
  });
});
`,
      },
      {
        path: "tests/components/Modal.test.tsx",
        content: `import { describe, it, expect, vi } from "vitest";
import { useEffect, useRef } from "react";
import { screen, waitFor, renderWithUser } from "../test-utils";

// Example Modal component for demonstration
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      modalRef.current?.focus();
    }

    return () => {
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
      tabIndex={-1}
    >
      <div aria-hidden="true" onClick={onClose} data-testid="backdrop" />
      <div role="document">
        <h2 id="modal-title">{title}</h2>
        {children}
        <button onClick={onClose} aria-label="Close modal">
          Close
        </button>
      </div>
    </div>
  );
}

describe("Modal", () => {
  describe("visibility", () => {
    it("renders when open", () => {
      renderWithUser(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Modal content
        </Modal>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Modal content")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      renderWithUser(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          Modal content
        </Modal>
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("closing behavior", () => {
    it("closes when close button is clicked", async () => {
      const handleClose = vi.fn();
      const { user } = renderWithUser(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          Content
        </Modal>
      );

      await user.click(screen.getByRole("button", { name: /close/i }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("closes when backdrop is clicked", async () => {
      const handleClose = vi.fn();
      const { user } = renderWithUser(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          Content
        </Modal>
      );

      await user.click(screen.getByTestId("backdrop"));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("closes when Escape key is pressed", async () => {
      const handleClose = vi.fn();
      const { user } = renderWithUser(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          Content
        </Modal>
      );

      await user.keyboard("{Escape}");

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility", () => {
    it("has correct ARIA attributes", () => {
      renderWithUser(
        <Modal isOpen={true} onClose={vi.fn()} title="Accessible Modal">
          Content
        </Modal>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
    });

    it("has accessible title", () => {
      renderWithUser(
        <Modal isOpen={true} onClose={vi.fn()} title="My Modal Title">
          Content
        </Modal>
      );

      expect(
        screen.getByRole("heading", { name: "My Modal Title" })
      ).toBeInTheDocument();
    });

    it("traps focus when open", async () => {
      const { user } = renderWithUser(
        <Modal isOpen={true} onClose={vi.fn()} title="Focus Test">
          <button>First button</button>
          <button>Second button</button>
        </Modal>
      );

      // Modal should receive focus on open
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toHaveFocus();
      });

      // Tab through focusable elements
      await user.tab();
      expect(screen.getByText("First button")).toHaveFocus();

      await user.tab();
      expect(screen.getByText("Second button")).toHaveFocus();
    });
  });
});
`,
      },
      {
        path: "tests/hooks/useAsync.test.ts",
        content: `import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useState, useCallback } from "react";

// Example useAsync hook for demonstration
interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

function useAsync<T>(asyncFunction: () => Promise<T>, immediate = true) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: immediate,
  });

  const execute = useCallback(async () => {
    setState({ data: null, error: null, isLoading: true });
    try {
      const data = await asyncFunction();
      setState({ data, error: null, isLoading: false });
      return data;
    } catch (error) {
      setState({
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        isLoading: false,
      });
      throw error;
    }
  }, [asyncFunction]);

  // Execute immediately if requested
  useState(() => {
    if (immediate) {
      execute();
    }
  });

  return { ...state, execute };
}

describe("useAsync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with loading state when immediate is true", () => {
    const asyncFn = vi.fn().mockResolvedValue("data");

    const { result } = renderHook(() => useAsync(asyncFn, true));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("starts without loading when immediate is false", () => {
    const asyncFn = vi.fn().mockResolvedValue("data");

    const { result } = renderHook(() => useAsync(asyncFn, false));

    expect(result.current.isLoading).toBe(false);
    expect(asyncFn).not.toHaveBeenCalled();
  });

  it("resolves with data on success", async () => {
    const mockData = { id: 1, name: "Test" };
    const asyncFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useAsync(asyncFn, false));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("handles errors correctly", async () => {
    const mockError = new Error("Failed to fetch");
    const asyncFn = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useAsync(asyncFn, false));

    await act(async () => {
      try {
        await result.current.execute();
      } catch {
        // Expected error
      }
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("resets state on re-execute", async () => {
    const asyncFn = vi
      .fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second");

    const { result } = renderHook(() => useAsync(asyncFn, false));

    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.data).toBe("first");

    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.data).toBe("second");
  });

  it("handles slow async operations", async () => {
    const asyncFn = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve("slow data"), 1000);
        })
    );

    const { result } = renderHook(() => useAsync(asyncFn, false));

    act(() => {
      result.current.execute();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe("slow data");
    });
  });
});
`,
      },
      {
        path: "tests/accessibility.test.tsx",
        content: `import { describe, it, expect } from "vitest";
import { render, screen, within } from "./test-utils";
import { axe, toHaveNoViolations } from "jest-axe";

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

// Example accessible components for demonstration
function AccessibleCard({
  title,
  description,
  imageUrl,
  imageAlt,
}: {
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
}) {
  return (
    <article aria-labelledby="card-title">
      <img src={imageUrl} alt={imageAlt} />
      <h2 id="card-title">{title}</h2>
      <p>{description}</p>
      <a href="#" aria-describedby="card-title">
        Learn more
      </a>
    </article>
  );
}

function AccessibleNavigation() {
  return (
    <nav aria-label="Main navigation">
      <ul role="list">
        <li>
          <a href="/" aria-current="page">
            Home
          </a>
        </li>
        <li>
          <a href="/about">About</a>
        </li>
        <li>
          <a href="/contact">Contact</a>
        </li>
      </ul>
    </nav>
  );
}

function AccessibleTable() {
  return (
    <table>
      <caption>User List</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Email</th>
          <th scope="col">Role</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>John Doe</td>
          <td>john@example.com</td>
          <td>Admin</td>
        </tr>
      </tbody>
    </table>
  );
}

describe("Accessibility", () => {
  describe("AccessibleCard", () => {
    it("has no accessibility violations", async () => {
      const { container } = render(
        <AccessibleCard
          title="Test Card"
          description="This is a test description"
          imageUrl="/test.jpg"
          imageAlt="Test image description"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has proper heading structure", () => {
      render(
        <AccessibleCard
          title="Card Title"
          description="Description"
          imageUrl="/test.jpg"
          imageAlt="Alt text"
        />
      );

      expect(
        screen.getByRole("heading", { level: 2, name: "Card Title" })
      ).toBeInTheDocument();
    });

    it("image has alt text", () => {
      render(
        <AccessibleCard
          title="Card Title"
          description="Description"
          imageUrl="/test.jpg"
          imageAlt="Descriptive alt text"
        />
      );

      expect(screen.getByAltText("Descriptive alt text")).toBeInTheDocument();
    });

    it("link is properly labeled", () => {
      render(
        <AccessibleCard
          title="Card Title"
          description="Description"
          imageUrl="/test.jpg"
          imageAlt="Alt text"
        />
      );

      const link = screen.getByRole("link", { name: /learn more/i });
      expect(link).toHaveAttribute("aria-describedby", "card-title");
    });
  });

  describe("AccessibleNavigation", () => {
    it("has no accessibility violations", async () => {
      const { container } = render(<AccessibleNavigation />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has proper navigation landmark", () => {
      render(<AccessibleNavigation />);

      expect(
        screen.getByRole("navigation", { name: /main/i })
      ).toBeInTheDocument();
    });

    it("indicates current page", () => {
      render(<AccessibleNavigation />);

      const homeLink = screen.getByRole("link", { name: /home/i });
      expect(homeLink).toHaveAttribute("aria-current", "page");
    });

    it("uses semantic list structure", () => {
      render(<AccessibleNavigation />);

      const nav = screen.getByRole("navigation");
      const list = within(nav).getByRole("list");
      const items = within(list).getAllByRole("listitem");

      expect(items).toHaveLength(3);
    });
  });

  describe("AccessibleTable", () => {
    it("has no accessibility violations", async () => {
      const { container } = render(<AccessibleTable />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has accessible table structure", () => {
      render(<AccessibleTable />);

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText("User List")).toBeInTheDocument(); // caption
    });

    it("has proper column headers", () => {
      render(<AccessibleTable />);

      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(3);
      expect(headers[0]).toHaveTextContent("Name");
    });
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
      { name: "@testing-library/react", dev: true },
      { name: "@testing-library/user-event", dev: true },
      { name: "@testing-library/jest-dom", dev: true },
      { name: "jest-axe", dev: true },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
