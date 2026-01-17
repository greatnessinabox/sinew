"use client";

import { useState, useMemo } from "react";
import type { LogStreamData, LogLevel } from "@/app/lib/demo/types";

interface LogStreamVisualizationProps {
  data: LogStreamData;
}

const levelConfig = {
  debug: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30" },
  info: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  warn: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  error: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 2,
  });
}

export function LogStreamVisualization({ data }: LogStreamVisualizationProps) {
  const { entries, levels } = data;
  const [filter, setFilter] = useState<LogLevel | "all">("all");

  const filteredEntries = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((e) => e.level === filter);
  }, [entries, filter]);

  const totalLogs = levels.debug + levels.info + levels.warn + levels.error;

  return (
    <div className="space-y-4">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <h4 className="text-foreground font-medium">Log Stream</h4>
        <div className="bg-code-bg flex items-center gap-1 rounded-lg p-1">
          {(["all", "debug", "info", "warn", "error"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                filter === level ? "bg-accent text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
              {level !== "all" && (
                <span className="ml-1 opacity-60">{levels[level as keyof typeof levels]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Level Stats */}
      <div className="grid grid-cols-4 gap-2">
        {(["debug", "info", "warn", "error"] as const).map((level) => {
          const config = levelConfig[level];
          const count = levels[level];
          const percentage = totalLogs > 0 ? (count / totalLogs) * 100 : 0;

          return (
            <div
              key={level}
              className={`rounded-lg border ${config.border} ${config.bg} p-2 text-center`}
            >
              <div className={`text-lg font-bold ${config.color}`}>{count}</div>
              <div className="text-muted text-xs">{level}</div>
              <div className="bg-code-bg mt-1 h-1 overflow-hidden rounded-full">
                <div
                  className={`h-full ${config.bg.replace("/10", "/50")}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Entries */}
      <div className="border-border bg-code-bg max-h-48 overflow-y-auto rounded-lg border">
        {filteredEntries.length === 0 ? (
          <div className="text-muted p-8 text-center text-sm">
            No logs to display
            {filter !== "all" && (
              <span className="text-muted/60 mt-1 block text-xs">
                Try selecting &quot;All&quot; to see all logs
              </span>
            )}
          </div>
        ) : (
          <div className="divide-border/50 divide-y">
            {filteredEntries.slice(-15).map((entry) => {
              const config = levelConfig[entry.level];
              return (
                <div
                  key={entry.id}
                  className={`flex items-start gap-3 px-3 py-2 font-mono text-xs ${config.bg}`}
                >
                  <span className="text-muted/60 w-20 flex-shrink-0">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  <span className={`w-12 flex-shrink-0 font-semibold uppercase ${config.color}`}>
                    {entry.level}
                  </span>
                  <span className="text-foreground flex-1">{entry.message}</span>
                  {entry.data && (
                    <span
                      className="text-muted max-w-[200px] flex-shrink-0 truncate"
                      title={JSON.stringify(entry.data)}
                    >
                      {JSON.stringify(entry.data)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Redaction Notice */}
      {entries.some(
        (e) => e.message.includes("[REDACTED]") || JSON.stringify(e.data).includes("[REDACTED]")
      ) && (
        <div className="text-muted flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full bg-yellow-400" />
          <span>Sensitive data automatically redacted</span>
        </div>
      )}
    </div>
  );
}
