"use client";

import type { CacheVisualizationData } from "@/app/lib/demo/types";

interface CacheStateVisualizationProps {
  data: CacheVisualizationData;
}

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return value.length > 20 ? `"${value.slice(0, 20)}..."` : `"${value}"`;
  }
  const str = JSON.stringify(value);
  return str.length > 30 ? str.slice(0, 30) + "..." : str;
}

function formatTTL(createdAt: number, ttl: number | null): string | null {
  if (ttl === null) return null;
  const remaining = Math.max(0, createdAt + ttl - Date.now());
  if (remaining <= 0) return "expired";
  return `${Math.ceil(remaining / 1000)}s`;
}

export function CacheStateVisualization({ data }: CacheStateVisualizationProps) {
  const { entries, stats, lastAction } = data;

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex items-center justify-between">
        <h4 className="text-foreground font-medium">Cache State</h4>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted">
            <span className="text-foreground font-medium">{stats.size}</span>/{stats.maxSize}{" "}
            entries
          </span>
          <span className="text-green-400">{stats.hits} hits</span>
          <span className="text-red-400">{stats.misses} misses</span>
          <span className="text-accent">{(stats.hitRate * 100).toFixed(0)}% hit rate</span>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="bg-code-bg h-2 overflow-hidden rounded-full">
        <div
          className="bg-accent h-full transition-all duration-300"
          style={{ width: `${(stats.size / stats.maxSize) * 100}%` }}
        />
      </div>

      {/* Entries */}
      <div className="bg-surface border-border max-h-48 overflow-y-auto rounded-lg border">
        {entries.length === 0 ? (
          <div className="text-muted p-4 text-center text-sm">Cache is empty</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border border-b">
                <th className="text-muted px-3 py-2 text-left text-xs font-medium">#</th>
                <th className="text-muted px-3 py-2 text-left text-xs font-medium">Key</th>
                <th className="text-muted px-3 py-2 text-left text-xs font-medium">Value</th>
                <th className="text-muted px-3 py-2 text-right text-xs font-medium">TTL</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const isLastAction = lastAction?.key === entry.key;
                const ttlStr = formatTTL(entry.createdAt, entry.ttl);

                return (
                  <tr
                    key={entry.key}
                    className={`border-border border-b transition-colors last:border-0 ${
                      isLastAction ? "bg-accent/10" : ""
                    }`}
                  >
                    <td className="text-muted/50 px-3 py-2 font-mono text-xs">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <code className="text-accent font-mono text-xs">{entry.key}</code>
                    </td>
                    <td className="text-muted px-3 py-2 font-mono text-xs">
                      {formatValue(entry.value)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {ttlStr ? (
                        <span
                          className={`text-xs ${
                            ttlStr === "expired" ? "text-red-400" : "text-muted"
                          }`}
                        >
                          {ttlStr}
                        </span>
                      ) : (
                        <span className="text-muted/50 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Last Action */}
      {lastAction && (
        <div className="text-muted flex items-center gap-2 text-xs">
          <span>Last action:</span>
          <span className="bg-accent/10 text-accent rounded px-2 py-0.5 font-medium">
            {lastAction.type.toUpperCase()}
          </span>
          <code className="text-foreground">{lastAction.key}</code>
          {lastAction.hit !== undefined && (
            <span className={lastAction.hit ? "text-green-400" : "text-red-400"}>
              ({lastAction.hit ? "HIT" : "MISS"})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
