"use client";

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="focus:bg-accent focus:text-background focus:ring-accent focus:ring-offset-background sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:px-4 focus:py-2 focus:ring-2 focus:ring-offset-2 focus:outline-none"
    >
      Skip to main content
    </a>
  );
}
