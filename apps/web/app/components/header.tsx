"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SearchTrigger } from "./search-command";
import { ThemeToggle } from "./theme-toggle";

// Menu icon for mobile
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/patterns") {
      return pathname.startsWith("/patterns");
    }
    if (path === "/demo") {
      return pathname.startsWith("/demo");
    }
    return pathname === path;
  };

  return (
    <header
      className="border-border/50 bg-background/80 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-md"
      role="banner"
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="Sinew - Home">
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-accent">s</span>inew
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-4 md:flex" role="navigation">
          <SearchTrigger />
          <Link
            href="/patterns"
            className={`text-sm transition-colors ${
              isActive("/patterns")
                ? "text-foreground font-medium"
                : "text-muted hover:text-foreground"
            }`}
            aria-current={isActive("/patterns") ? "page" : undefined}
          >
            Patterns
          </Link>
          <Link
            href="/demo"
            className={`text-sm transition-colors ${
              isActive("/demo") ? "text-foreground font-medium" : "text-muted hover:text-foreground"
            }`}
            aria-current={isActive("/demo") ? "page" : undefined}
          >
            Playground
          </Link>
          <a
            href="https://github.com/greatnessinabox/sinew"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-foreground text-sm transition-colors"
            aria-label="GitHub repository (opens in new tab)"
          >
            GitHub
          </a>
          <ThemeToggle />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <SearchTrigger />
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-muted hover:text-foreground p-2 transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <CloseIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <MenuIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav
          id="mobile-menu"
          className="border-border bg-background border-t md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="space-y-4 px-6 py-4">
            <Link
              href="/patterns"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm transition-colors ${
                isActive("/patterns")
                  ? "text-foreground font-medium"
                  : "text-muted hover:text-foreground"
              }`}
              aria-current={isActive("/patterns") ? "page" : undefined}
            >
              Patterns
            </Link>
            <Link
              href="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm transition-colors ${
                isActive("/demo")
                  ? "text-foreground font-medium"
                  : "text-muted hover:text-foreground"
              }`}
              aria-current={isActive("/demo") ? "page" : undefined}
            >
              Playground
            </Link>
            <a
              href="https://github.com/greatnessinabox/sinew"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-foreground block text-sm transition-colors"
              aria-label="GitHub repository (opens in new tab)"
            >
              GitHub
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

export default Header;
