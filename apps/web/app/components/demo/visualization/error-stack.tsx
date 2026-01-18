"use client";

import type { ErrorVisualizationData } from "@/app/lib/demo/types";

interface ErrorStackVisualizationProps {
  data: ErrorVisualizationData;
}

const statusCodeColors: Record<number, { bg: string; text: string; border: string }> = {
  400: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
  401: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  403: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  404: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  409: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  429: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
  500: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
};

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function ErrorStackVisualization({ data }: ErrorStackVisualizationProps) {
  const { errorType, statusCode, message, code, handled, stack } = data;
  const defaultColors = { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" };
  const colors = statusCodeColors[statusCode] ?? defaultColors;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-foreground font-medium">Error Response</h4>
        <div className="flex items-center gap-2">
          {handled ? (
            <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
              <CheckCircleIcon className="h-3 w-3" />
              Handled
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
              <AlertCircleIcon className="h-3 w-3" />
              Unhandled
            </span>
          )}
        </div>
      </div>

      {/* Error Card */}
      <div className={`rounded-lg border ${colors.border} ${colors.bg} p-4`}>
        {/* Status Code */}
        <div className="mb-3 flex items-center gap-3">
          <span className={`text-3xl font-bold ${colors.text}`}>{statusCode}</span>
          <div>
            <div className={`font-semibold ${colors.text}`}>{errorType}</div>
            <div className="text-muted text-xs">{code}</div>
          </div>
        </div>

        {/* Message */}
        <div className="border-border bg-surface mb-4 rounded-lg border p-3">
          <p className="text-foreground text-sm">{message}</p>
        </div>

        {/* JSON Response Preview */}
        <div className="bg-code-bg rounded-lg p-3 font-mono text-xs">
          <div className="text-muted">
            {/* Response body */}
            {"// Response body"}
          </div>
          <div className="text-foreground mt-1">{"{"}</div>
          <div className="pl-4">
            <span className="text-accent">&quot;error&quot;</span>
            <span className="text-muted">: </span>
            <span className="text-green-400">&quot;{code}&quot;</span>
            <span className="text-muted">,</span>
          </div>
          <div className="pl-4">
            <span className="text-accent">&quot;message&quot;</span>
            <span className="text-muted">: </span>
            <span className="text-green-400">&quot;{message}&quot;</span>
            <span className="text-muted">,</span>
          </div>
          <div className="pl-4">
            <span className="text-accent">&quot;statusCode&quot;</span>
            <span className="text-muted">: </span>
            <span className="text-orange-400">{statusCode}</span>
          </div>
          <div className="text-foreground">{"}"}</div>
        </div>
      </div>

      {/* Stack Trace (if available) */}
      {stack && stack.length > 0 && (
        <div className="border-border bg-surface rounded-lg border p-4">
          <h5 className="text-muted mb-2 text-xs font-semibold tracking-wider uppercase">
            Stack Trace
          </h5>
          <div className="space-y-1 font-mono text-xs">
            {stack.slice(0, 5).map((line, idx) => (
              <div
                key={idx}
                className={`rounded px-2 py-1 ${idx === 0 ? "bg-red-500/10 text-red-400" : "text-muted"}`}
              >
                {line}
              </div>
            ))}
            {stack.length > 5 && (
              <div className="text-muted/50 px-2 py-1">... {stack.length - 5} more frames</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
