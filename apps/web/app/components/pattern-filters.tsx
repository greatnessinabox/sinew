"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Pattern, Complexity } from "@/app/lib/patterns";

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

interface PatternFiltersProps {
  patterns: Pattern[];
  categories: string[];
}

// Category display names
const categoryConfig: Record<string, { name: string }> = {
  database: { name: "Database" },
  auth: { name: "Auth" },
  environment: { name: "Environment" },
  deployment: { name: "Deployment" },
  api: { name: "API" },
  testing: { name: "Testing" },
  caching: { name: "Caching" },
  email: { name: "Email" },
  payments: { name: "Payments" },
  monitoring: { name: "Monitoring" },
};

// Complexity config
const complexityConfig: Record<
  Complexity,
  { label: string; dot: string; active: string; hover: string }
> = {
  beginner: {
    label: "Beginner",
    dot: "bg-green-400",
    active: "bg-green-500/15 border-green-500/40 text-green-400",
    hover: "hover:border-green-500/30",
  },
  intermediate: {
    label: "Intermediate",
    dot: "bg-yellow-400",
    active: "bg-yellow-500/15 border-yellow-500/40 text-yellow-400",
    hover: "hover:border-yellow-500/30",
  },
  advanced: {
    label: "Advanced",
    dot: "bg-red-400",
    active: "bg-red-500/15 border-red-500/40 text-red-400",
    hover: "hover:border-red-500/30",
  },
};

// For pattern cards
const complexityColors: Record<Complexity, string> = {
  beginner: "bg-green-500/10 text-green-400 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function PatternFilters({ patterns, categories }: PatternFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedComplexity, setSelectedComplexity] = useState<Complexity | null>(null);

  const hasActiveFilters = selectedCategory !== null || selectedComplexity !== null;

  // Filter patterns based on selections
  const filteredPatterns = useMemo(() => {
    return patterns.filter((pattern) => {
      if (selectedCategory && pattern.category !== selectedCategory) {
        return false;
      }
      if (selectedComplexity && pattern.complexity !== selectedComplexity) {
        return false;
      }
      return true;
    });
  }, [patterns, selectedCategory, selectedComplexity]);

  // Count patterns per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pattern of patterns) {
      counts[pattern.category] = (counts[pattern.category] || 0) + 1;
    }
    return counts;
  }, [patterns]);

  // Group filtered patterns by category
  const groupedPatterns = useMemo(() => {
    const grouped: Record<string, Pattern[]> = {};
    for (const pattern of filteredPatterns) {
      const category = pattern.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category]!.push(pattern);
    }
    return grouped;
  }, [filteredPatterns]);

  const complexities: Complexity[] = ["beginner", "intermediate", "advanced"];

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedComplexity(null);
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-10 space-y-6">
        {/* Filter bar */}
        <div className="border-border bg-surface/50 flex flex-col gap-6 rounded-xl border p-4 lg:flex-row lg:items-start">
          {/* Category filter */}
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-muted text-xs font-medium uppercase tracking-wider">
                Category
              </span>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-accent text-xs hover:underline"
                >
                  clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                  selectedCategory === null
                    ? "bg-accent border-accent font-medium text-white"
                    : "border-border text-muted hover:text-foreground hover:border-muted hover:bg-surface"
                }`}
              >
                All
                <span className="ml-1.5 text-xs opacity-70">{patterns.length}</span>
              </button>
              {categories.map((category) => {
                const config = categoryConfig[category];
                const count = categoryCounts[category] || 0;
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                      isActive
                        ? "bg-accent border-accent font-medium text-white"
                        : "border-border text-muted hover:text-foreground hover:border-muted hover:bg-surface"
                    }`}
                  >
                    {config?.name || category}
                    <span className={`ml-1.5 text-xs ${isActive ? "opacity-70" : "opacity-50"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="bg-border hidden h-16 w-px self-center lg:block" />
          <div className="bg-border h-px w-full lg:hidden" />

          {/* Complexity filter */}
          <div className="lg:w-auto">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-muted text-xs font-medium uppercase tracking-wider">
                Complexity
              </span>
              {selectedComplexity && (
                <button
                  onClick={() => setSelectedComplexity(null)}
                  className="text-accent text-xs hover:underline"
                >
                  clear
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedComplexity(null)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                  selectedComplexity === null
                    ? "bg-surface border-muted text-foreground"
                    : "border-border text-muted hover:text-foreground hover:border-muted"
                }`}
              >
                Any
              </button>
              {complexities.map((complexity) => {
                const config = complexityConfig[complexity];
                const isActive = selectedComplexity === complexity;
                return (
                  <button
                    key={complexity}
                    onClick={() => setSelectedComplexity(complexity)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all ${
                      isActive
                        ? config.active
                        : `border-border text-muted ${config.hover} hover:text-foreground`
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                    <span className="hidden sm:inline">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results bar */}
        <div className="flex items-center justify-between">
          <p className="text-muted text-sm">
            {hasActiveFilters ? (
              <>
                <span className="text-foreground font-medium">{filteredPatterns.length}</span> of{" "}
                {patterns.length} patterns
              </>
            ) : (
              <>
                <span className="text-foreground font-medium">{patterns.length}</span> patterns
              </>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-accent flex items-center gap-1 text-sm hover:underline"
            >
              <XIcon className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Pattern groups */}
      <div className="space-y-16">
        {Object.entries(groupedPatterns).map(([category, categoryPatterns]) => (
          <section key={category}>
            <div className="mb-8 flex items-center gap-4">
              <h2 className="text-2xl font-semibold">
                {categoryConfig[category]?.name || category}
              </h2>
              <div className="bg-border h-px flex-1" />
              <span className="text-muted text-sm">{categoryPatterns.length} patterns</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryPatterns.map((pattern) => (
                <Link
                  key={pattern.slug}
                  href={`/patterns/${pattern.category}/${pattern.slug}`}
                  className="border-border bg-surface/50 hover:border-accent/40 hover:bg-surface group relative rounded-xl border p-5 transition-all"
                >
                  {/* Status indicator */}
                  <div className="absolute right-4 top-4 flex items-center gap-2">
                    {pattern.alternatives && pattern.alternatives.length > 0 && (
                      <span className="text-xs text-amber-400" title="Paid alternatives available">
                        *
                      </span>
                    )}
                    <span className="bg-accent block h-2 w-2 rounded-full" />
                  </div>

                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-foreground group-hover:text-accent font-semibold transition-colors">
                      {pattern.name}
                    </h3>
                    {pattern.complexity && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${complexityColors[pattern.complexity]}`}
                      >
                        {pattern.complexity}
                      </span>
                    )}
                  </div>

                  <p className="text-muted line-clamp-2 text-sm leading-relaxed">
                    {pattern.description}
                  </p>

                  <div className="text-accent mt-4 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                    View pattern →
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {filteredPatterns.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted">No patterns match your filters.</p>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedComplexity(null);
              }}
              className="text-accent mt-4 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
