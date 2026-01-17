"use client";

import { useState } from "react";

export interface TestedWithItem {
  name: string;
  version: string;
  status: "passing" | "failing" | "untested";
}

interface TestedWithProps {
  items: TestedWithItem[];
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

const statusConfig = {
  passing: {
    icon: CheckIcon,
    label: "Passing",
    bgColor: "bg-green-500/10",
    textColor: "text-green-400",
    borderColor: "border-green-500/20",
  },
  failing: {
    icon: XIcon,
    label: "Failing",
    bgColor: "bg-red-500/10",
    textColor: "text-red-400",
    borderColor: "border-red-500/20",
  },
  untested: {
    icon: QuestionIcon,
    label: "Untested",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-500/20",
  },
};

export function TestedWith({ items }: TestedWithProps) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const passingCount = items.filter((i) => i.status === "passing").length;
  const displayItems = expanded ? items : items.slice(0, 3);

  return (
    <div className="border-border bg-surface/30 rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <svg
            className="text-accent h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Tested With
        </h3>
        <span className="text-muted text-xs">
          {passingCount}/{items.length} passing
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {displayItems.map((item, i) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;

          return (
            <div
              key={i}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 ${config.bgColor} ${config.borderColor}`}
              title={`${item.name} ${item.version}: ${config.label}`}
            >
              <Icon className={`h-3.5 w-3.5 ${config.textColor}`} />
              <span className="text-foreground text-xs font-medium">{item.name}</span>
              <span className="text-muted text-xs">{item.version}</span>
            </div>
          );
        })}

        {items.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-accent hover:text-accent-secondary text-xs transition-colors"
          >
            {expanded ? "Show less" : `+${items.length - 3} more`}
          </button>
        )}
      </div>
    </div>
  );
}

// Compact badge for pattern cards
export function TestedBadge({ count, total }: { count: number; total: number }) {
  const allPassing = count === total;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
        allPassing
          ? "border border-green-500/20 bg-green-500/10 text-green-400"
          : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
      }`}
      title={`${count} of ${total} tests passing`}
    >
      {allPassing ? (
        <CheckIcon className="h-3 w-3" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
      )}
      {count}/{total}
    </span>
  );
}
