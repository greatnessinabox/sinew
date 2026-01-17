"use client";

import { useState } from "react";

type PricingTier = "free" | "freemium" | "paid" | "enterprise";

interface Alternative {
  name: string;
  description: string;
  url: string;
  pricingTier: PricingTier;
  pricingNote?: string;
  advantages: string[];
  recommended?: boolean;
}

interface AlternativesCardProps {
  alternatives: Alternative[];
}

function PricingBadge({ tier }: { tier: PricingTier }) {
  const styles = {
    free: "bg-green-500/10 text-green-400",
    freemium: "bg-blue-500/10 text-blue-400",
    paid: "bg-amber-500/10 text-amber-400",
    enterprise: "bg-purple-500/10 text-purple-400",
  };

  const labels = {
    free: "Free",
    freemium: "Freemium",
    paid: "Paid",
    enterprise: "Enterprise",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[tier]}`}
    >
      {labels[tier]}
    </span>
  );
}

export function AlternativesCard({ alternatives }: AlternativesCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="border-border bg-surface/30 mt-8 overflow-hidden rounded-xl border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="hover:bg-surface/50 flex w-full items-center justify-between px-6 py-4 text-left transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-amber-400">*</span>
          <span className="text-foreground font-medium">Paid Alternatives</span>
          <span className="text-muted text-sm">Better options exist if you need more features</span>
        </div>
        <svg
          className={`text-muted h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-border border-t px-6 py-4">
          <p className="text-muted mb-4 text-sm">
            This pattern is free and production-ready. These alternatives offer additional features
            if you need them:
          </p>
          <div className="space-y-4">
            {alternatives.map((alt) => (
              <div key={alt.name} className="border-border/50 bg-surface/50 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={alt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-accent font-semibold transition-colors"
                      >
                        {alt.name}
                        {alt.recommended && (
                          <span className="text-accent ml-2 text-xs">(Recommended)</span>
                        )}
                      </a>
                      <PricingBadge tier={alt.pricingTier} />
                    </div>
                    <p className="text-muted mt-1 text-sm">{alt.description}</p>
                    {alt.pricingNote && (
                      <p className="text-muted/70 mt-1 text-xs">{alt.pricingNote}</p>
                    )}
                  </div>
                </div>
                {alt.advantages.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {alt.advantages.map((advantage, i) => (
                      <li key={i} className="text-muted flex items-start gap-2 text-sm">
                        <svg
                          className="text-accent mt-0.5 h-4 w-4 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {advantage}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AlternativesIndicator() {
  return (
    <span className="text-xs text-amber-400" title="Paid alternatives available">
      *
    </span>
  );
}
