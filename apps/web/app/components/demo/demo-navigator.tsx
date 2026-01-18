"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { PatternDemoConfig } from "@/app/lib/demo/types";

interface DemoNavigatorProps {
  demos: PatternDemoConfig[];
  currentCategory: string;
  currentSlug: string;
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    caching: "Caching",
    api: "API",
    monitoring: "Monitoring",
    environment: "Environment",
    auth: "Authentication",
  };
  return labels[category] ?? category;
}

export function DemoNavigator({ demos, currentCategory, currentSlug }: DemoNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group demos by category
  const groupedDemos = demos.reduce<Record<string, PatternDemoConfig[]>>((acc, demo) => {
    const category = demo.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category]!.push(demo);
    return acc;
  }, {});

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="border-border bg-surface text-foreground hover:border-accent/40 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm"
      >
        <span className="hidden sm:inline">Switch Demo</span>
        <span className="sm:hidden">Demos</span>
        <ChevronDownIcon className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="border-border bg-surface absolute top-full right-0 z-50 mt-2 w-64 rounded-lg border shadow-xl sm:w-72">
          <div className="max-h-80 overflow-y-auto p-2">
            {Object.entries(groupedDemos).map(([category, categoryDemos]) => (
              <div key={category} className="mb-2 last:mb-0">
                <div className="text-muted px-2 py-1.5 text-xs font-semibold tracking-wider uppercase">
                  {getCategoryLabel(category)}
                </div>
                {categoryDemos.map((demo) => {
                  const isCurrent = demo.category === currentCategory && demo.slug === currentSlug;
                  return (
                    <Link
                      key={`${demo.category}/${demo.slug}`}
                      href={`/demo/${demo.category}/${demo.slug}`}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors ${
                        isCurrent
                          ? "bg-accent/10 text-accent"
                          : "text-foreground hover:bg-surface-hover"
                      }`}
                    >
                      <span className="flex-1 truncate">{demo.title}</span>
                      {isCurrent && <span className="bg-accent h-1.5 w-1.5 rounded-full" />}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
