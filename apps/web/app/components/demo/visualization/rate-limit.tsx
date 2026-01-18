"use client";

import { useEffect, useState } from "react";
import type { RateLimitData } from "@/app/lib/demo/types";

interface RateLimitVisualizationProps {
  data: RateLimitData;
}

export function RateLimitVisualization({ data }: RateLimitVisualizationProps) {
  const { limit, remaining, reset, blocked, requests } = data;
  const [timeToReset, setTimeToReset] = useState(0);

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((reset - now) / 1000));
      setTimeToReset(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [reset]);

  const usedSlots = limit - remaining;
  const percentage = (remaining / limit) * 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-foreground font-medium">Rate Limit Status</h4>
        <div className="flex items-center gap-2">
          {blocked ? (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
              BLOCKED
            </span>
          ) : (
            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
              OK
            </span>
          )}
        </div>
      </div>

      {/* Bucket Visualization */}
      <div className="bg-code-bg relative h-32 overflow-hidden rounded-lg">
        {/* Water level */}
        <div
          className={`absolute right-0 bottom-0 left-0 transition-all duration-300 ${
            blocked ? "bg-red-500/30" : "bg-accent/30"
          }`}
          style={{ height: `${100 - percentage}%` }}
        />

        {/* Request bubbles */}
        <div className="absolute inset-0 p-2">
          <div className="flex h-full flex-wrap content-end gap-1">
            {Array.from({ length: usedSlots }).map((_, i) => (
              <div
                key={i}
                className={`h-4 w-4 rounded-full ${blocked ? "bg-red-500" : "bg-accent"}`}
                style={{
                  animation: `pulse 1s ease-in-out ${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Limit line */}
        <div className="border-muted/30 absolute top-0 right-0 left-0 border-t-2 border-dashed">
          <span className="bg-code-bg text-muted absolute top-1 right-2 text-xs">
            Limit: {limit}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-surface border-border rounded-lg border p-3">
          <div className="text-foreground text-2xl font-bold">{remaining}</div>
          <div className="text-muted text-xs">Remaining</div>
        </div>
        <div className="bg-surface border-border rounded-lg border p-3">
          <div className="text-foreground text-2xl font-bold">{usedSlots}</div>
          <div className="text-muted text-xs">Used</div>
        </div>
        <div className="bg-surface border-border rounded-lg border p-3">
          <div
            className={`text-2xl font-bold ${timeToReset <= 3 ? "text-accent" : "text-foreground"}`}
          >
            {timeToReset}s
          </div>
          <div className="text-muted text-xs">Reset In</div>
        </div>
      </div>

      {/* Recent Requests */}
      {requests.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-muted mr-2 text-xs">Recent:</span>
          {requests.slice(-10).map((req, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${req.allowed ? "bg-green-500" : "bg-red-500"}`}
              title={`${req.allowed ? "Allowed" : "Blocked"} at ${new Date(req.timestamp).toLocaleTimeString()}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
