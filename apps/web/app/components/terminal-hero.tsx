"use client";

import { useState, useEffect } from "react";

interface TerminalLine {
  type: "command" | "output" | "success";
  text: string;
  delay: number;
}

const terminalLines: TerminalLine[] = [
  { type: "command", text: "npx sinew init", delay: 0 },
  { type: "output", text: "✓ Created sinew.config.ts", delay: 800 },
  { type: "command", text: "npx sinew add database/connection-pooling", delay: 1400 },
  { type: "output", text: "✓ Added lib/db.ts", delay: 2200 },
  { type: "output", text: "✓ Added prisma/schema.prisma", delay: 2500 },
  { type: "success", text: "Ready to ship 🚀", delay: 3000 },
];

export function TerminalHero() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [currentText, setCurrentText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (visibleLines >= terminalLines.length) {
      setIsTyping(false);
      return;
    }

    const line = terminalLines[visibleLines];
    if (!line) return;

    const timeout = setTimeout(
      () => {
        if (line.type === "command") {
          // Type out command character by character
          let charIndex = 0;
          const typeInterval = setInterval(() => {
            if (charIndex <= line.text.length) {
              setCurrentText(line.text.slice(0, charIndex));
              charIndex++;
            } else {
              clearInterval(typeInterval);
              setTimeout(() => {
                setVisibleLines((v) => v + 1);
                setCurrentText("");
              }, 300);
            }
          }, 50);
          return () => clearInterval(typeInterval);
        } else {
          setVisibleLines((v) => v + 1);
        }
      },
      line.delay - (visibleLines > 0 ? (terminalLines[visibleLines - 1]?.delay ?? 0) : 0)
    );

    return () => clearTimeout(timeout);
  }, [visibleLines]);

  // Restart animation on click
  const handleRestart = () => {
    setVisibleLines(0);
    setCurrentText("");
    setIsTyping(true);
  };

  return (
    <div
      onClick={handleRestart}
      className="border-border bg-code-bg hover:border-accent/40 group relative cursor-pointer overflow-hidden rounded-xl border transition-colors"
      title="Click to replay"
    >
      {/* Terminal header */}
      <div className="border-border bg-surface/50 flex items-center gap-2 border-b px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <span className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-muted ml-2 font-mono text-xs">Terminal</span>
        <span className="text-muted/50 ml-auto text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
          click to replay
        </span>
      </div>

      {/* Terminal content */}
      <div className="min-h-[180px] p-4 font-mono text-sm">
        {terminalLines.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="mb-1">
            {line.type === "command" ? (
              <div className="flex items-center gap-2">
                <span className="text-accent">$</span>
                <span className="text-foreground">{line.text}</span>
              </div>
            ) : line.type === "success" ? (
              <div className="text-success mt-2 font-medium">{line.text}</div>
            ) : (
              <div className="text-muted pl-4">{line.text}</div>
            )}
          </div>
        ))}

        {/* Currently typing line */}
        {visibleLines < terminalLines.length && terminalLines[visibleLines]?.type === "command" && (
          <div className="flex items-center gap-2">
            <span className="text-accent">$</span>
            <span className="text-foreground">{currentText}</span>
            {isTyping && <span className="bg-accent cursor-blink h-4 w-2" />}
          </div>
        )}

        {/* Idle cursor */}
        {!isTyping && visibleLines >= terminalLines.length && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-accent">$</span>
            <span className="bg-accent/60 cursor-blink h-4 w-2" />
          </div>
        )}
      </div>
    </div>
  );
}
