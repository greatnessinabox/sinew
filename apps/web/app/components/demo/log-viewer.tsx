"use client";

import { useRef, useEffect, useState } from "react";
import type { LogEntry } from "@/app/lib/demo/types";

interface LogViewerProps {
  logs: LogEntry[];
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

const levelColors = {
  debug: "text-muted",
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

const levelBg = {
  debug: "bg-muted/10",
  info: "bg-blue-500/10",
  warn: "bg-yellow-500/10",
  error: "bg-red-500/10",
};

export function LogViewer({ logs }: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  return (
    <div className="bg-code-bg border-border flex h-full flex-col rounded-lg border">
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="bg-accent h-2 w-2 animate-pulse rounded-full" />
          <span className="text-muted text-sm">Live Logs</span>
          <span className="text-muted/50 text-xs">({logs.length} entries)</span>
        </div>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`rounded px-2 py-1 text-xs transition-colors ${
            autoScroll ? "bg-accent/20 text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          Auto-scroll {autoScroll ? "ON" : "OFF"}
        </button>
      </div>

      {/* Log Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-muted py-8 text-center">
            <p>Execute an action to see logs here...</p>
            <p className="text-muted/50 mt-2 text-xs">
              Logs show real-time output from pattern execution
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className={`flex gap-3 rounded px-2 py-1 ${levelBg[log.level]}`}>
                <span className="text-muted/50 w-24 shrink-0">{formatTime(log.timestamp)}</span>
                <span className={`w-14 shrink-0 font-semibold ${levelColors[log.level]}`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="text-muted/60 w-20 shrink-0 truncate">[{log.source}]</span>
                <span className="text-foreground flex-1">{log.message}</span>
                {log.data && (
                  <span
                    className="text-accent/60 ml-2 shrink-0 truncate"
                    title={JSON.stringify(log.data)}
                  >
                    {JSON.stringify(log.data).slice(0, 50)}
                    {JSON.stringify(log.data).length > 50 ? "..." : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
