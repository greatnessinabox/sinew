import { codeToHtml, bundledLanguages } from "shiki";
import { CopyButton } from "./copy-button";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  /** Show language badge */
  showLanguage?: boolean;
}

// Map unsupported languages to supported ones
const languageMap: Record<string, string> = {
  gitignore: "bash",
  dockerignore: "bash",
  env: "bash",
  plaintext: "text",
  txt: "text",
};

// Get a supported language, falling back to text if not supported
function getSupportedLanguage(lang: string): string {
  // Check if it's in our mapping
  if (languageMap[lang]) {
    return languageMap[lang];
  }
  // Check if it's a bundled language
  if (lang in bundledLanguages) {
    return lang;
  }
  // Fall back to text
  return "text";
}

// Custom theme matching Sinew's warm orange accent
const sinewTheme = {
  name: "sinew",
  type: "dark" as const,
  colors: {
    "editor.background": "#0a0a0a",
    "editor.foreground": "#f0f0f0",
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#666666", fontStyle: "italic" },
    },
    {
      scope: ["string", "string.quoted"],
      settings: { foreground: "#98c379" },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.other"],
      settings: { foreground: "#d19a66" },
    },
    {
      scope: ["keyword", "storage.type", "storage.modifier"],
      settings: { foreground: "#ff6b35" },
    },
    {
      scope: ["entity.name.function", "support.function"],
      settings: { foreground: "#61afef" },
    },
    {
      scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"],
      settings: { foreground: "#e5c07b" },
    },
    {
      scope: ["variable", "variable.other"],
      settings: { foreground: "#f0f0f0" },
    },
    {
      scope: ["entity.name.tag"],
      settings: { foreground: "#e06c75" },
    },
    {
      scope: ["entity.other.attribute-name"],
      settings: { foreground: "#d19a66" },
    },
    {
      scope: ["punctuation", "meta.brace"],
      settings: { foreground: "#abb2bf" },
    },
    {
      scope: ["keyword.operator"],
      settings: { foreground: "#56b6c2" },
    },
    {
      scope: ["variable.parameter"],
      settings: { foreground: "#f0f0f0" },
    },
    {
      scope: ["meta.object-literal.key"],
      settings: { foreground: "#e06c75" },
    },
    {
      scope: ["support.type.property-name.json"],
      settings: { foreground: "#e06c75" },
    },
  ],
};

// Display-friendly language names
const languageDisplay: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  tsx: "TSX",
  jsx: "JSX",
  bash: "Bash",
  shell: "Shell",
  json: "JSON",
  yaml: "YAML",
  dockerfile: "Dockerfile",
  sql: "SQL",
  css: "CSS",
  html: "HTML",
  markdown: "Markdown",
  python: "Python",
  rust: "Rust",
  go: "Go",
  text: "Plain Text",
};

// Check if code is likely a shell command (for smart copy)
function isShellCommand(code: string, language: string): boolean {
  const shellLangs = ["bash", "shell", "sh", "zsh"];
  if (!shellLangs.includes(language)) return false;
  // Check if it's a simple command (no multi-line scripts)
  const lines = code.trim().split("\n");
  return (
    lines.length <= 3 &&
    lines.some(
      (l) => l.trim().startsWith("$") || /^(npm|pnpm|bun|yarn|npx|docker|git)\s/.test(l.trim())
    )
  );
}

export async function CodeBlock({
  code,
  language = "typescript",
  filename,
  showLineNumbers = false,
  showLanguage = true,
}: CodeBlockProps) {
  const supportedLang = getSupportedLanguage(language);
  const html = await codeToHtml(code, {
    lang: supportedLang,
    theme: sinewTheme,
  });

  const displayLang = languageDisplay[supportedLang] || supportedLang;
  const smartCopy = isShellCommand(code, supportedLang);

  return (
    <div className="border-border group relative overflow-hidden rounded-lg border">
      {/* Header with filename and copy button */}
      {filename && (
        <div className="bg-code-bg border-border flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-muted font-mono text-sm">{filename}</span>
            {showLanguage && (
              <span className="text-muted/60 bg-surface border-border rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                {displayLang}
              </span>
            )}
          </div>
          <CopyButton text={code} smartCopy={smartCopy} />
        </div>
      )}

      {/* Code content with scroll shadows */}
      <div className="relative">
        {/* Left scroll shadow */}
        <div className="from-code-bg pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r to-transparent opacity-0 transition-opacity group-has-[.code-scroll]:opacity-100" />
        {/* Right scroll shadow */}
        <div className="from-code-bg pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l to-transparent" />

        <div
          className={`code-scroll bg-code-bg overflow-x-auto p-4 text-sm ${
            showLineNumbers ? "[&_code]:grid [&_code]:gap-y-0" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Copy button (when no filename header) */}
        {!filename && (
          <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
            <CopyButton text={code} variant="minimal" smartCopy={smartCopy} />
          </div>
        )}

        {/* Language badge at bottom right (when no filename header) */}
        {!filename && showLanguage && (
          <div className="absolute bottom-2 right-2 opacity-40 transition-opacity group-hover:opacity-80">
            <span className="text-muted/60 bg-code-bg/80 border-border/30 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
              {displayLang}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple inline code component
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-surface text-accent rounded px-1.5 py-0.5 font-mono text-sm">
      {children}
    </code>
  );
}
