"use client";

import { useMemo, useSyncExternalStore } from "react";

interface DemoCodeBlockProps {
  code: string;
  language: string;
  highlightedLines?: string; // e.g., "1-15" or "17,25,30-35"
}

function parseLineRanges(rangeStr: string | undefined): Set<number> {
  if (!rangeStr) return new Set();

  const lines = new Set<number>();
  const parts = rangeStr.split(",");

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [start, end] = trimmed.split("-").map(Number);
      if (start && end) {
        for (let i = start; i <= end; i++) {
          lines.add(i);
        }
      }
    } else {
      const num = Number(trimmed);
      if (num) {
        lines.add(num);
      }
    }
  }

  return lines;
}

export function DemoCodeBlock({ code, language, highlightedLines }: DemoCodeBlockProps) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const lines = useMemo(() => code.split("\n"), [code]);
  const highlightedSet = useMemo(() => parseLineRanges(highlightedLines), [highlightedLines]);

  // Simple syntax highlighting (client-side)
  const highlightSyntax = (line: string): string => {
    // Escape HTML first to prevent XSS and preserve special characters
    const escapeHtml = (str: string) =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const escaped = escapeHtml(line);

    // Use placeholder tokens to avoid nested replacements
    const tokens: string[] = [];
    const tokenize = (html: string, className: string) => {
      const token = `__TOKEN_${tokens.length}__`;
      tokens.push(`<span class="${className}">${html}</span>`);
      return token;
    };

    let result = escaped;

    // Comments first (highest priority, won't be processed further)
    result = result.replace(/(\/\/.*)$/g, (_, comment) => tokenize(comment, "text-muted italic"));

    // Strings (handle before other replacements)
    result = result.replace(
      /(&quot;|&#39;|`)((?:(?!\1)[^\\]|\\.)*)(\1)/g,
      (match, open, content, close) => tokenize(open + content + close, "text-green-400")
    );
    // Regular quotes
    result = result.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g, (match) =>
      tokenize(match, "text-green-400")
    );

    // Keywords
    result = result.replace(
      /\b(const|let|var|function|return|if|else|for|while|class|interface|type|export|import|from|async|await|new|this|extends|implements|try|catch|throw|finally|break|continue|switch|case|default)\b/g,
      (_, keyword) => tokenize(keyword, "text-accent")
    );

    // Types (capitalized words often after colon)
    result = result.replace(
      /:\s*([A-Z][a-zA-Z0-9]*)/g,
      (_, type) => `: ${tokenize(type, "text-yellow-400")}`
    );

    // Numbers (only match standalone numbers, not inside tokens)
    result = result.replace(/(?<!__TOKEN_)\b(\d+(?:\.\d+)?)\b(?!__)/g, (_, num) =>
      tokenize(num, "text-orange-400")
    );

    // Function calls (word followed by parenthesis)
    result = result.replace(/\b([a-z][a-zA-Z0-9]*)\s*(?=\()/g, (_, fn) =>
      tokenize(fn, "text-blue-400")
    );

    // Replace tokens with actual HTML
    tokens.forEach((html, i) => {
      result = result.replace(`__TOKEN_${i}__`, html);
    });

    return result;
  };

  if (!isClient) {
    return (
      <div className="bg-code-bg border-border rounded-lg border">
        <div className="border-border flex items-center gap-2 border-b px-4 py-2">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <span className="h-3 w-3 rounded-full bg-green-500/80" />
          <span className="text-muted ml-2 font-mono text-xs">{language}</span>
        </div>
        <div className="p-4">
          <pre className="text-muted text-sm">Loading...</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-code-bg border-border overflow-hidden rounded-lg border">
      {/* Header */}
      <div className="border-border flex items-center gap-2 border-b px-4 py-2">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
        <span className="h-3 w-3 rounded-full bg-green-500/80" />
        <span className="text-muted ml-2 font-mono text-xs">{language}</span>
        {highlightedLines && (
          <span className="text-accent/60 ml-auto text-xs">
            Highlighted: lines {highlightedLines}
          </span>
        )}
      </div>

      {/* Code */}
      <div className="overflow-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNumber = idx + 1;
              const isHighlighted = highlightedSet.has(lineNumber);

              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isHighlighted ? "bg-accent/10" : "hover:bg-surface/50"
                  }`}
                >
                  <td
                    className={`border-border border-r px-4 py-0.5 text-right font-mono text-xs select-none ${
                      isHighlighted ? "text-accent" : "text-muted/50"
                    }`}
                    style={{ width: "3rem" }}
                  >
                    {lineNumber}
                  </td>
                  <td className="px-4 py-0.5">
                    <pre className="font-mono text-sm">
                      <code
                        dangerouslySetInnerHTML={{
                          __html: highlightSyntax(line) || "&nbsp;",
                        }}
                      />
                    </pre>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
