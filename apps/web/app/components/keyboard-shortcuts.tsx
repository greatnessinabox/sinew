"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Shortcut {
  keys: string[];
  description: string;
  action?: () => void;
}

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const shortcuts: Shortcut[] = [
    { keys: ["?"], description: "Show keyboard shortcuts" },
    { keys: ["Cmd", "K"], description: "Open search" },
    { keys: ["G", "H"], description: "Go to home" },
    { keys: ["G", "P"], description: "Go to patterns" },
    { keys: ["Esc"], description: "Close dialogs" },
  ];

  useEffect(() => {
    let lastKey = "";
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTime;

      // ? to show shortcuts
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      // Escape to close
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }

      // G + key combinations (must be pressed within 500ms)
      if (e.key.toLowerCase() === "g" && !e.metaKey && !e.ctrlKey) {
        lastKey = "g";
        lastKeyTime = now;
        return;
      }

      if (lastKey === "g" && timeSinceLastKey < 500) {
        if (e.key.toLowerCase() === "h") {
          e.preventDefault();
          router.push("/");
        } else if (e.key.toLowerCase() === "p") {
          e.preventDefault();
          router.push("/patterns");
        }
        lastKey = "";
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  if (!isOpen) return null;

  return (
    <div
      className="bg-background/80 fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="bg-background border-border mx-4 w-full max-w-md overflow-hidden rounded-xl border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-3 p-4">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-muted text-sm">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, j) => (
                  <span key={j}>
                    <kbd className="border-border bg-surface rounded border px-2 py-1 font-mono text-xs">
                      {key}
                    </kbd>
                    {j < shortcut.keys.length - 1 && <span className="text-muted mx-1">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-border bg-surface/50 border-t px-4 py-3">
          <p className="text-muted text-center text-xs">
            Press{" "}
            <kbd className="border-border bg-background rounded border px-1.5 py-0.5 text-xs">
              Esc
            </kbd>{" "}
            to close
          </p>
        </div>
      </div>
    </div>
  );
}

// Floating indicator for keyboard shortcuts
export function KeyboardShortcutsHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Hide after 5 seconds
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="animate-fade-in fixed bottom-4 right-4 z-50">
      <div className="bg-surface border-border text-muted flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg">
        <span>Press</span>
        <kbd className="border-border bg-background rounded border px-1.5 py-0.5 font-mono text-xs">
          ?
        </kbd>
        <span>for shortcuts</span>
      </div>
    </div>
  );
}
