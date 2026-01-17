"use client";

import type { ValidationResult } from "@/app/lib/demo/types";

interface ValidationTreeVisualizationProps {
  data: ValidationResult;
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

export function ValidationTreeVisualization({ data }: ValidationTreeVisualizationProps) {
  const { success, errors, data: validData } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-foreground font-medium">Validation Result</h4>
        {success ? (
          <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-400">
            <CheckIcon className="h-4 w-4" />
            Valid
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-400">
            <XIcon className="h-4 w-4" />
            Invalid
          </span>
        )}
      </div>

      {/* Validation Tree */}
      <div className="border-border bg-surface overflow-hidden rounded-lg border">
        {success && validData ? (
          <div className="divide-border divide-y">
            {Object.entries(validData as Record<string, unknown>).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
                  <CheckIcon className="h-3.5 w-3.5 text-green-400" />
                </div>
                <div className="flex-1">
                  <code className="text-accent text-sm font-medium">{key}</code>
                </div>
                <div className="text-muted font-mono text-sm">
                  {typeof value === "string" ? (
                    <span className="text-green-400">&quot;{value}&quot;</span>
                  ) : typeof value === "number" ? (
                    <span className="text-orange-400">{value}</span>
                  ) : (
                    <span className="text-muted">{JSON.stringify(value)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : errors && errors.length > 0 ? (
          <div className="divide-border divide-y">
            {errors.map((error, idx) => (
              <div key={idx} className="flex items-start gap-3 px-4 py-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20">
                  <XIcon className="h-3.5 w-3.5 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-accent text-sm font-medium">
                      {error.path.join(".") || "root"}
                    </code>
                    <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-mono text-xs text-red-400">
                      {error.code}
                    </span>
                  </div>
                  <p className="text-muted mt-1 text-sm">{error.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted p-4 text-center text-sm">No validation data available</div>
        )}
      </div>

      {/* Summary */}
      {!success && errors && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2">
          <span className="text-sm text-red-400">
            {errors.length} validation error{errors.length !== 1 ? "s" : ""} found
          </span>
          <span className="text-muted text-xs">Fix the highlighted fields and try again</span>
        </div>
      )}
    </div>
  );
}
