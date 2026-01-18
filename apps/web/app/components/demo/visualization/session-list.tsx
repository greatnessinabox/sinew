"use client";

import { useEffect, useState } from "react";
import type { SessionVisualizationData, SessionEntry } from "@/app/lib/demo/types";

interface SessionListVisualizationProps {
  data: SessionVisualizationData;
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function SmartphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}

function TabletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}

function renderDeviceIcon(device: string, className: string) {
  const lower = device.toLowerCase();
  if (lower.includes("iphone") || lower.includes("android") || lower.includes("mobile")) {
    return <SmartphoneIcon className={className} />;
  }
  if (lower.includes("ipad") || lower.includes("tablet")) {
    return <TabletIcon className={className} />;
  }
  return <MonitorIcon className={className} />;
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

function formatExpiresIn(timestamp: number): string {
  const seconds = Math.floor((timestamp - Date.now()) / 1000);
  if (seconds < 0) return "expired";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function SessionCard({ session, isLast }: { session: SessionEntry; isLast: boolean }) {
  const [, setTick] = useState(0);

  // Update time display
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`relative flex items-start gap-4 p-4 ${
        session.isCurrent ? "bg-accent/5 border-l-accent border-l-2" : "hover:bg-surface/50"
      } ${!isLast ? "border-border border-b" : ""}`}
    >
      {/* Device Icon */}
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
          session.isCurrent ? "bg-accent/20" : "bg-surface"
        }`}
      >
        {renderDeviceIcon(
          session.device,
          `h-5 w-5 ${session.isCurrent ? "text-accent" : "text-muted"}`
        )}
      </div>

      {/* Session Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium">{session.device}</span>
          {session.isCurrent && (
            <span className="bg-accent/20 text-accent rounded-full px-2 py-0.5 text-xs font-medium">
              Current
            </span>
          )}
        </div>
        <div className="text-muted mt-1 flex items-center gap-3 text-xs">
          <span>{session.browser}</span>
          <span>•</span>
          <span>{session.ip}</span>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs">
          <span className="text-muted">Created {formatTimeAgo(session.createdAt)}</span>
          <span className="text-muted">Last active {formatTimeAgo(session.lastActivity)}</span>
        </div>
      </div>

      {/* Expiry */}
      <div className="flex-shrink-0 text-right">
        <div className="text-muted text-xs">Expires in</div>
        <div className="text-foreground font-mono text-sm font-medium">
          {formatExpiresIn(session.expiresAt)}
        </div>
      </div>
    </div>
  );
}

export function SessionListVisualization({ data }: SessionListVisualizationProps) {
  const { sessions, stats } = data;

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <h4 className="text-foreground font-medium">Active Sessions</h4>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted">
            <span className="font-medium text-green-400">{stats.active}</span> active
          </span>
          <span className="text-muted">
            <span className="text-muted font-medium">{stats.expired}</span> expired
          </span>
        </div>
      </div>

      {/* Sessions List */}
      <div className="border-border bg-surface overflow-hidden rounded-lg border">
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <MonitorIcon className="text-muted/50 mx-auto h-8 w-8" />
            <p className="text-muted mt-2 text-sm">No active sessions</p>
            <p className="text-muted/60 mt-1 text-xs">Create a session to get started</p>
          </div>
        ) : (
          sessions.map((session, idx) => (
            <SessionCard key={session.id} session={session} isLast={idx === sessions.length - 1} />
          ))
        )}
      </div>

      {/* Security Note */}
      {sessions.length > 1 && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="text-xs text-yellow-400">
            {sessions.length} device{sessions.length !== 1 ? "s" : ""} logged in
          </span>
          <span className="text-muted text-xs">— Revoke sessions you don&apos;t recognize</span>
        </div>
      )}
    </div>
  );
}
