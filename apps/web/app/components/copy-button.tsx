"use client";

import { useState, useSyncExternalStore } from "react";

interface CopyButtonProps {
  text: string;
  variant?: "default" | "minimal";
  /** If true, strips leading $ from shell commands */
  smartCopy?: boolean;
}

// Detect macOS for keyboard shortcut display
function useIsMac() {
  return useSyncExternalStore(
    () => () => {},
    () => navigator.platform.toUpperCase().includes("MAC"),
    () => true
  );
}

export function CopyButton({ text, variant = "default", smartCopy = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const isMac = useIsMac();

  const handleCopy = async () => {
    let copyText = text;
    // Smart copy: strip leading $ and whitespace from shell commands
    if (smartCopy) {
      copyText = text.replace(/^\$\s*/, "").trim();
    }
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortcutHint = isMac ? "⌘C" : "Ctrl+C";

  if (variant === "minimal") {
    return (
      <button
        onClick={handleCopy}
        className="group/copy text-muted hover:text-accent hover:bg-surface relative rounded p-1.5 transition-colors"
        aria-label={copied ? "Copied" : "Copy to clipboard"}
        title={`Copy ${shortcutHint}`}
      >
        {copied ? <CheckIcon className="text-accent h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
        {/* Keyboard shortcut hint */}
        <span className="bg-surface border-border pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap opacity-0 transition-opacity group-hover/copy:opacity-100">
          {shortcutHint}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className={`group/copy relative rounded border px-3 py-1.5 text-xs font-medium transition-all ${
        copied
          ? "border-accent text-accent bg-accent/10"
          : "border-border text-muted hover:text-foreground hover:border-muted"
      } `}
      title={`Copy ${shortcutHint}`}
    >
      {copied ? "Copied!" : "Copy"}
      {/* Keyboard shortcut hint */}
      {!copied && (
        <span className="bg-surface border-border pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] opacity-0 transition-opacity group-hover/copy:opacity-100">
          {shortcutHint}
        </span>
      )}
    </button>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
