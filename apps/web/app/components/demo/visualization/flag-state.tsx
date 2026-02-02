"use client";

import { useEffect, useState } from "react";
import type {
  FeatureFlagsVisualizationData,
  FeatureFlag,
  FlagEvaluation,
} from "@/app/lib/demo/types";

interface FlagStateVisualizationProps {
  data: FeatureFlagsVisualizationData;
}

function ToggleIcon({ enabled, className }: { enabled: boolean; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {enabled ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      )}
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getRolloutColor(percentage: number): string {
  if (percentage === 0) return "bg-red-500";
  if (percentage < 25) return "bg-orange-500";
  if (percentage < 50) return "bg-yellow-500";
  if (percentage < 75) return "bg-blue-500";
  if (percentage < 100) return "bg-cyan-500";
  return "bg-green-500";
}

function FlagCard({ flag, isHighlighted }: { flag: FeatureFlag; isHighlighted: boolean }) {
  return (
    <div
      className={`relative rounded-lg border p-4 transition-all ${
        isHighlighted
          ? "border-accent bg-accent/5 ring-accent/20 ring-2"
          : "border-border bg-surface hover:border-border/80"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              flag.enabled ? "bg-green-500/20" : "bg-red-500/20"
            }`}
          >
            <ToggleIcon
              enabled={flag.enabled}
              className={`h-5 w-5 ${flag.enabled ? "text-green-400" : "text-red-400"}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium">{flag.name}</span>
              <code className="bg-surface text-muted rounded px-1.5 py-0.5 font-mono text-xs">
                {flag.key}
              </code>
            </div>
            <p className="text-muted mt-0.5 text-xs">{flag.description}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            flag.enabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {flag.enabled ? "ON" : "OFF"}
        </span>
      </div>

      {/* Rollout Progress */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted">Rollout</span>
          <span className="text-foreground font-mono">{flag.rolloutPercentage}%</span>
        </div>
        <div className="bg-background h-2 overflow-hidden rounded-full">
          <div
            className={`h-full transition-all ${getRolloutColor(flag.rolloutPercentage)}`}
            style={{ width: `${flag.rolloutPercentage}%` }}
          />
        </div>
      </div>

      {/* Targeted Users */}
      {flag.targetedUsers.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <UserIcon className="text-muted h-3.5 w-3.5" />
          <span className="text-muted text-xs">Targeted:</span>
          <div className="flex flex-wrap gap-1">
            {flag.targetedUsers.slice(0, 3).map((user) => (
              <span
                key={user}
                className="bg-accent/20 text-accent rounded px-1.5 py-0.5 font-mono text-xs"
              >
                {user}
              </span>
            ))}
            {flag.targetedUsers.length > 3 && (
              <span className="text-muted text-xs">+{flag.targetedUsers.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {/* Updated time */}
      <div className="text-muted mt-3 text-xs">Updated {formatTimeAgo(flag.updatedAt)}</div>
    </div>
  );
}

function EvaluationRow({ evaluation }: { evaluation: FlagEvaluation }) {
  return (
    <div className="border-border hover:bg-surface/50 flex items-center justify-between border-b px-3 py-2 last:border-b-0">
      <div className="flex items-center gap-3">
        <code className="bg-surface text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
          {evaluation.flagKey}
        </code>
        <span className="text-muted text-xs">for</span>
        <code className="text-muted font-mono text-xs">{evaluation.userId}</code>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`text-xs ${
            evaluation.reason === "targeted"
              ? "text-accent"
              : evaluation.reason === "rollout"
                ? "text-blue-400"
                : evaluation.reason === "disabled"
                  ? "text-red-400"
                  : "text-muted"
          }`}
        >
          {evaluation.reason}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            evaluation.enabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {evaluation.enabled ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}

export function FlagStateVisualization({ data }: FlagStateVisualizationProps) {
  const { flags, evaluations, currentUser, stats, lastAction } = data;
  const [, setTick] = useState(0);

  // Update time display
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-foreground font-medium">Feature Flags</h4>
          <div className="bg-surface text-muted flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs">
            <UserIcon className="h-3.5 w-3.5" />
            <span className="font-mono">{currentUser}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted">
            <span className="font-medium text-green-400">{stats.enabledFlags}</span>/
            {stats.totalFlags} enabled
          </span>
          <span className="text-muted">
            <span className="text-muted font-medium">{stats.evaluationsCount}</span> evaluations
          </span>
        </div>
      </div>

      {/* Flags Grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {flags.map((flag) => (
          <FlagCard key={flag.key} flag={flag} isHighlighted={lastAction?.flagKey === flag.key} />
        ))}
      </div>

      {/* Recent Evaluations */}
      {evaluations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-muted text-sm font-medium">Recent Evaluations</h4>
          <div className="border-border bg-surface overflow-hidden rounded-lg border">
            {evaluations.slice(0, 5).map((evaluation, idx) => (
              <EvaluationRow
                key={`${evaluation.flagKey}-${evaluation.timestamp}-${idx}`}
                evaluation={evaluation}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {flags.length === 0 && (
        <div className="border-border bg-surface rounded-lg border p-8 text-center">
          <FlagIcon className="text-muted/50 mx-auto h-8 w-8" />
          <p className="text-muted mt-2 text-sm">No feature flags configured</p>
        </div>
      )}
    </div>
  );
}
