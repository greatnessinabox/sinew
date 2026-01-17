"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { patterns, type Pattern } from "@/app/lib/patterns";

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CommandIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

// Category display names
const categoryNames: Record<string, string> = {
  database: "Database",
  auth: "Authentication",
  environment: "Environment",
  deployment: "Deployment",
  api: "API",
  testing: "Testing",
  caching: "Caching",
  email: "Email",
  payments: "Payments",
  monitoring: "Monitoring",
};

// Complexity colors
const complexityColors: Record<string, string> = {
  beginner: "text-green-400",
  intermediate: "text-yellow-400",
  advanced: "text-red-400",
};

interface SearchResultProps {
  pattern: Pattern;
  isSelected: boolean;
  onClick: () => void;
}

function SearchResult({ pattern, isSelected, onClick }: SearchResultProps) {
  return (
    <button
      id={`result-${pattern.slug}`}
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
      className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors ${
        isSelected ? "bg-accent/10" : "hover:bg-surface"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium">{pattern.name}</span>
          {pattern.complexity && (
            <span
              className={`text-xs ${complexityColors[pattern.complexity]}`}
              aria-label={`Complexity: ${pattern.complexity}`}
            >
              {pattern.complexity}
            </span>
          )}
          {pattern.alternatives && pattern.alternatives.length > 0 && (
            <span className="text-xs text-amber-400" aria-label="Has paid alternatives">
              *
            </span>
          )}
        </div>
        <p className="text-muted truncate text-sm">{pattern.description}</p>
      </div>
      <span className="text-muted bg-surface border-border shrink-0 rounded border px-2 py-1 text-xs">
        {categoryNames[pattern.category] || pattern.category}
      </span>
    </button>
  );
}

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border-border bg-surface/50 text-muted hover:text-foreground hover:border-accent/40 flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors"
        aria-label="Search patterns (press Command K)"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <SearchIcon className="h-4 w-4" aria-hidden="true" />
        <span className="hidden text-sm sm:inline">Search patterns...</span>
        <kbd
          className="text-muted/70 ml-2 hidden items-center gap-0.5 text-xs sm:flex"
          aria-hidden="true"
        >
          <CommandIcon className="h-3 w-3" />
          <span>K</span>
        </kbd>
      </button>

      {open && <SearchDialog onClose={() => setOpen(false)} />}
    </>
  );
}

interface SearchDialogProps {
  onClose: () => void;
}

function SearchDialog({ onClose }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fuzzy match helper - matches if all characters appear in order
  const fuzzyMatch = (text: string, query: string): { match: boolean; score: number } => {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match gets highest score
    if (textLower.includes(queryLower)) {
      return { match: true, score: 100 - textLower.indexOf(queryLower) };
    }

    // Fuzzy match: all query chars must appear in order
    let queryIndex = 0;
    let consecutiveBonus = 0;
    let lastMatchIndex = -2;

    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        // Bonus for consecutive matches
        if (i === lastMatchIndex + 1) consecutiveBonus += 5;
        // Bonus for matching at word boundaries
        if (i === 0 || textLower[i - 1] === " " || textLower[i - 1] === "-") consecutiveBonus += 3;
        lastMatchIndex = i;
        queryIndex++;
      }
    }

    if (queryIndex === queryLower.length) {
      return { match: true, score: 50 + consecutiveBonus };
    }

    return { match: false, score: 0 };
  };

  // Filter patterns based on query with fuzzy matching
  const filteredPatterns = patterns
    .map((pattern) => {
      if (!query) return { pattern, score: 0 };

      const nameMatch = fuzzyMatch(pattern.name, query);
      const descMatch = fuzzyMatch(pattern.description, query);
      const catMatch = fuzzyMatch(pattern.category, query);
      const tagMatch = pattern.tags?.reduce(
        (best, tag) => {
          const match = fuzzyMatch(tag, query);
          return match.score > best.score ? match : best;
        },
        { match: false, score: 0 }
      ) || { match: false, score: 0 };

      const bestScore = Math.max(
        nameMatch.score * 2, // Name matches weighted higher
        descMatch.score,
        catMatch.score * 1.5,
        tagMatch.score
      );

      const hasMatch = nameMatch.match || descMatch.match || catMatch.match || tagMatch.match;

      return { pattern, score: hasMatch ? bestScore : -1 };
    })
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(({ pattern }) => pattern);

  // Group by category
  const groupedPatterns = filteredPatterns.reduce(
    (acc, pattern) => {
      const category = pattern.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(pattern);
      return acc;
    },
    {} as Record<string, Pattern[]>
  );

  // Flatten for navigation
  const flatPatterns = Object.values(groupedPatterns).flat();

  // Navigate to pattern
  const navigateToPattern = useCallback(
    (pattern: Pattern) => {
      router.push(`/patterns/${pattern.category}/${pattern.slug}`);
      onClose();
    },
    [router, onClose]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, flatPatterns.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          if (flatPatterns[selectedIndex]) {
            navigateToPattern(flatPatterns[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [flatPatterns, selectedIndex, navigateToPattern, onClose]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const selected = list.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  let currentIndex = 0;

  return (
    <div
      className="bg-background/80 fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Search patterns"
    >
      <div className="bg-background border-border mx-4 w-full max-w-xl overflow-hidden rounded-xl border shadow-2xl">
        {/* Search Input */}
        <div className="border-border flex items-center gap-3 border-b px-4 py-3">
          <SearchIcon className="text-muted h-5 w-5 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patterns..."
            className="text-foreground placeholder:text-muted flex-1 bg-transparent outline-none"
            aria-label="Search patterns"
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-activedescendant={
              flatPatterns[selectedIndex] ? `result-${flatPatterns[selectedIndex].slug}` : undefined
            }
          />
          <kbd
            className="text-muted/70 border-border bg-surface rounded border px-1.5 py-0.5 text-xs"
            aria-hidden="true"
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          id="search-results"
          className="max-h-[60vh] overflow-y-auto"
          role="listbox"
          aria-label="Search results"
        >
          {flatPatterns.length === 0 ? (
            <div className="text-muted px-4 py-8 text-center">
              No patterns found for &quot;{query}&quot;
            </div>
          ) : (
            Object.entries(groupedPatterns).map(([category, categoryPatterns]) => (
              <div key={category}>
                <div className="text-muted bg-surface/50 sticky top-0 px-4 py-2 text-xs font-medium">
                  {categoryNames[category] || category}
                </div>
                {categoryPatterns.map((pattern) => {
                  const index = currentIndex++;
                  const isSelected = index === selectedIndex;
                  return (
                    <div key={pattern.slug} data-selected={isSelected}>
                      <SearchResult
                        pattern={pattern}
                        isSelected={isSelected}
                        onClick={() => navigateToPattern(pattern)}
                      />
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-border bg-surface/50 text-muted flex items-center gap-4 border-t px-4 py-2 text-xs">
          <span className="flex items-center gap-1">
            <kbd className="border-border bg-background rounded border px-1 py-0.5">↑</kbd>
            <kbd className="border-border bg-background rounded border px-1 py-0.5">↓</kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border-border bg-background rounded border px-1.5 py-0.5">↵</kbd>
            <span>Select</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border-border bg-background rounded border px-1.5 py-0.5">esc</kbd>
            <span>Close</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default SearchTrigger;
