"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";
const THEME_STORAGE_KEY = "theme";

const themeListeners = new Set<() => void>();

const notifyThemeListeners = () => {
  themeListeners.forEach((listener) => listener());
};

const subscribeToTheme = (listener: () => void) => {
  themeListeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      themeListeners.delete(listener);
    };
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    themeListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
};

const getThemeSnapshot = (): Theme => {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  return stored ?? "system";
};

const getThemeServerSnapshot = (): Theme => "system";

const setStoredTheme = (theme: Theme) => {
  if (typeof window === "undefined") return;
  if (theme === "system") {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } else {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
  notifyThemeListeners();
};

const useStoredTheme = (): Theme =>
  useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getThemeServerSnapshot);

const useIsClient = (): boolean =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const theme = useStoredTheme();
  const isClient = useIsClient();

  useEffect(() => {
    if (!isClient) return;

    const root = document.documentElement;

    if (theme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", systemDark);
      root.classList.toggle("light", !systemDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
      root.classList.toggle("light", theme === "light");
    }
  }, [theme, isClient]);

  // Listen for system theme changes
  useEffect(() => {
    if (!isClient) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        const root = document.documentElement;
        root.classList.toggle("dark", mediaQuery.matches);
        root.classList.toggle("light", !mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, isClient]);

  const cycleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setStoredTheme(themes[nextIndex] ?? "system");
  };

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <button
        className="border-border bg-surface/50 text-muted hover:text-foreground hover:border-accent/40 rounded-lg border p-2 transition-colors"
        aria-label="Toggle theme"
      >
        <div className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className="border-border bg-surface/50 text-muted hover:text-foreground hover:border-accent/40 rounded-lg border p-2 transition-colors"
      aria-label={`Current theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
    >
      {theme === "light" && <SunIcon className="h-4 w-4" />}
      {theme === "dark" && <MoonIcon className="h-4 w-4" />}
      {theme === "system" && <SystemIcon className="h-4 w-4" />}
    </button>
  );
}

// Script to prevent flash of wrong theme
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme');
              var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var isDark = theme === 'dark' || (!theme && systemDark);
              document.documentElement.classList.add(isDark ? 'dark' : 'light');
            } catch (e) {}
          })();
        `,
      }}
    />
  );
}
