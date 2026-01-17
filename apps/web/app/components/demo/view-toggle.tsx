"use client";

interface ViewToggleProps {
  view: "steps" | "logs";
  onViewChange: (view: "steps" | "logs") => void;
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="bg-surface border-border flex rounded-lg border p-1">
      <button
        onClick={() => onViewChange("steps")}
        className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
          view === "steps" ? "bg-accent text-white" : "text-muted hover:text-foreground"
        }`}
      >
        <PlayIcon className="h-4 w-4" />
        Step-by-Step
      </button>
      <button
        onClick={() => onViewChange("logs")}
        className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
          view === "logs" ? "bg-accent text-white" : "text-muted hover:text-foreground"
        }`}
      >
        <TerminalIcon className="h-4 w-4" />
        Live Logs
      </button>
    </div>
  );
}
