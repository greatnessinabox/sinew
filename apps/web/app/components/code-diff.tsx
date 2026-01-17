import { codeToHtml, bundledLanguages } from "shiki";

interface CodeDiffProps {
  before: string;
  after: string;
  language?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

// Map unsupported languages to supported ones
const languageMap: Record<string, string> = {
  gitignore: "bash",
  dockerignore: "bash",
  env: "bash",
  plaintext: "text",
  txt: "text",
};

function getSupportedLanguage(lang: string): string {
  if (languageMap[lang]) return languageMap[lang];
  if (lang in bundledLanguages) return lang;
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
    { scope: ["string", "string.quoted"], settings: { foreground: "#98c379" } },
    {
      scope: ["constant.numeric", "constant.language", "constant.other"],
      settings: { foreground: "#d19a66" },
    },
    { scope: ["keyword", "storage.type", "storage.modifier"], settings: { foreground: "#ff6b35" } },
    { scope: ["entity.name.function", "support.function"], settings: { foreground: "#61afef" } },
    {
      scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"],
      settings: { foreground: "#e5c07b" },
    },
    { scope: ["variable", "variable.other"], settings: { foreground: "#f0f0f0" } },
    { scope: ["entity.name.tag"], settings: { foreground: "#e06c75" } },
    { scope: ["entity.other.attribute-name"], settings: { foreground: "#d19a66" } },
    { scope: ["punctuation", "meta.brace"], settings: { foreground: "#abb2bf" } },
    { scope: ["keyword.operator"], settings: { foreground: "#56b6c2" } },
  ],
};

export async function CodeDiff({
  before,
  after,
  language = "typescript",
  beforeLabel = "Before",
  afterLabel = "After",
}: CodeDiffProps) {
  const supportedLang = getSupportedLanguage(language);

  const [beforeHtml, afterHtml] = await Promise.all([
    codeToHtml(before, { lang: supportedLang, theme: sinewTheme }),
    codeToHtml(after, { lang: supportedLang, theme: sinewTheme }),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Before */}
      <div className="border-border overflow-hidden rounded-lg border">
        <div className="bg-error/10 border-border flex items-center gap-2 border-b px-4 py-2">
          <span className="bg-error h-2 w-2 rounded-full" />
          <span className="text-error/80 text-sm font-medium">{beforeLabel}</span>
        </div>
        <div
          className="bg-code-bg overflow-x-auto p-4 text-sm"
          dangerouslySetInnerHTML={{ __html: beforeHtml }}
        />
      </div>

      {/* After */}
      <div className="border-border overflow-hidden rounded-lg border">
        <div className="bg-success/10 border-border flex items-center gap-2 border-b px-4 py-2">
          <span className="bg-success h-2 w-2 rounded-full" />
          <span className="text-success/80 text-sm font-medium">{afterLabel}</span>
        </div>
        <div
          className="bg-code-bg overflow-x-auto p-4 text-sm"
          dangerouslySetInnerHTML={{ __html: afterHtml }}
        />
      </div>
    </div>
  );
}

// Inline diff for single changes
interface InlineDiffProps {
  removed?: string;
  added?: string;
}

export function InlineDiff({ removed, added }: InlineDiffProps) {
  return (
    <span className="font-mono text-sm">
      {removed && (
        <span className="bg-error/20 text-error mr-1 rounded px-1 py-0.5 line-through">
          {removed}
        </span>
      )}
      {added && <span className="bg-success/20 text-success rounded px-1 py-0.5">{added}</span>}
    </span>
  );
}
