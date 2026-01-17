"use client";

import { useState } from "react";

interface CopyPathProps {
  path: string;
  className?: string;
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
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
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function CopyPath({ path, className = "" }: CopyPathProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`border-border bg-surface/50 text-muted hover:border-accent/40 hover:text-foreground flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${className}`}
      title="Copy file path"
    >
      {copied ? (
        <>
          <CheckIcon className="text-accent h-3.5 w-3.5" />
          <span className="text-accent">Copied!</span>
        </>
      ) : (
        <>
          <CopyIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Copy path</span>
        </>
      )}
    </button>
  );
}
