import fs from "fs";
import path from "path";

const contentDirectory = path.join(process.cwd(), "content/patterns");

export interface CodeFile {
  path: string;
  content: string;
  language: string;
}

export interface CodeBlock {
  language: string;
  content: string;
}

export interface ContentSection {
  title: string;
  content: string;
  codeBlocks: CodeBlock[];
  parts: ContentPart[];
}

export interface PatternContent {
  title: string;
  description: string;
  problem: ContentSection | null;
  solution: ContentSection | null;
  files: CodeFile[];
  configuration: ContentSection | null;
  usage: ContentSection | null;
  troubleshooting: ContentSection | null;
  additionalSections: ContentSection[];
}

// Get the language from file extension
function getLanguage(filePath: string): string {
  if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) return "typescript";
  if (filePath.endsWith(".js") || filePath.endsWith(".jsx")) return "javascript";
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".yml") || filePath.endsWith(".yaml")) return "yaml";
  if (filePath.endsWith(".md") || filePath.endsWith(".mdx")) return "markdown";
  if (filePath.endsWith(".env") || filePath.includes(".env.")) return "bash";
  if (filePath.includes("Dockerfile")) return "dockerfile";
  if (filePath.endsWith(".prisma")) return "prisma";
  if (filePath.endsWith(".sql")) return "sql";
  return "typescript";
}

// Content part can be either text or a code block
export interface ContentPart {
  type: "text" | "code";
  content: string;
  language?: string;
}

// Parse a section into parts (text and code blocks in order)
function parseSection(sectionContent: string): {
  text: string;
  codeBlocks: CodeBlock[];
  parts: ContentPart[];
} {
  const codeBlocks: CodeBlock[] = [];
  const parts: ContentPart[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(sectionContent)) !== null) {
    const [fullMatch, language, code] = match;

    // Skip code blocks with title= (those are files, handled separately)
    if (fullMatch.includes('title="')) {
      continue;
    }

    // Add text before this code block
    const textBefore = sectionContent.slice(lastIndex, match.index).trim();
    if (textBefore) {
      parts.push({ type: "text", content: textBefore });
    }

    // Add the code block
    if (code) {
      parts.push({
        type: "code",
        content: code.trim(),
        language: language || "typescript",
      });
      codeBlocks.push({
        language: language || "typescript",
        content: code.trim(),
      });
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text after last code block
  const remainingText = sectionContent.slice(lastIndex).trim();
  if (remainingText) {
    // Remove any file code blocks (with title=) from remaining text
    const cleanedText = remainingText.replace(/```\w*\s*title="[^"]+"\n[\s\S]*?```/g, "").trim();
    if (cleanedText) {
      parts.push({ type: "text", content: cleanedText });
    }
  }

  // Also create a clean text version (for backwards compat)
  const text = sectionContent.replace(/```[\s\S]*?```/g, "").trim();

  return { text, codeBlocks, parts };
}

// Load pattern content from MDX file
export async function getPatternContent(
  category: string,
  slug: string
): Promise<PatternContent | null> {
  const filePath = path.join(contentDirectory, category, `${slug}.mdx`);

  try {
    const content = fs.readFileSync(filePath, "utf-8");

    // Extract title (first h1)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1] ?? "";

    // Extract description (text between title and first h2)
    const descMatch = content.match(/^#\s+.+\n\n([\s\S]*?)(?=\n##\s)/);
    const description = descMatch?.[1]?.trim() ?? "";

    // Split into sections by h2
    const sections = content.split(/\n(?=##\s)/);

    // Extract named sections
    const getSectionByTitle = (patterns: string[]): ContentSection | null => {
      for (const pattern of patterns) {
        const section = sections.find((s) =>
          s.toLowerCase().startsWith(`## ${pattern.toLowerCase()}`)
        );
        if (section) {
          const lines = section.split("\n");
          const firstLine = lines[0] ?? "";
          const sectionTitle = firstLine.replace(/^##\s+/, "").trim();
          const sectionContent = lines.slice(1).join("\n").trim();
          const { text, codeBlocks, parts } = parseSection(sectionContent);
          return { title: sectionTitle, content: text, codeBlocks, parts };
        }
      }
      return null;
    };

    // Extract files from the Files section
    const files: CodeFile[] = [];
    const filesSection = sections.find((s) => s.toLowerCase().startsWith("## files"));
    if (filesSection) {
      const codeBlockRegex = /```(\w+)?\s*(?:title="([^"]+)")?\n([\s\S]*?)```/g;
      let match;
      while ((match = codeBlockRegex.exec(filesSection)) !== null) {
        const [, language, titleAttr, code] = match;
        if (titleAttr && code) {
          files.push({
            path: titleAttr,
            content: code.trim(),
            language: language || getLanguage(titleAttr),
          });
        }
      }
    }

    // Collect additional sections that aren't standard
    const standardSections = [
      "the problem",
      "the solution",
      "files",
      "configuration",
      "usage",
      "troubleshooting",
    ];
    const additionalSections: ContentSection[] = [];
    for (const section of sections) {
      if (!section.startsWith("## ")) continue;
      const firstLine = section.split("\n")[0] ?? "";
      const sectionTitle = firstLine.replace(/^##\s+/, "").trim();
      if (
        !standardSections.some(
          (s) => sectionTitle.toLowerCase() === s || sectionTitle.toLowerCase().startsWith(s)
        )
      ) {
        const sectionContent = section.split("\n").slice(1).join("\n").trim();
        const { text, codeBlocks, parts } = parseSection(sectionContent);
        additionalSections.push({ title: sectionTitle, content: text, codeBlocks, parts });
      }
    }

    return {
      title,
      description,
      problem: getSectionByTitle(["the problem", "problem"]),
      solution: getSectionByTitle(["the solution", "solution"]),
      files,
      configuration: getSectionByTitle(["configuration", "config", "setup"]),
      usage: getSectionByTitle(["usage", "how to use", "examples"]),
      troubleshooting: getSectionByTitle(["troubleshooting", "common issues", "gotchas"]),
      additionalSections,
    };
  } catch {
    return null;
  }
}

// Check if pattern has MDX content
export function hasPatternContent(category: string, slug: string): boolean {
  const filePath = path.join(contentDirectory, category, `${slug}.mdx`);
  return fs.existsSync(filePath);
}

// Get all pattern slugs that have content
export function getAllPatternSlugs(): { category: string; slug: string }[] {
  const slugs: { category: string; slug: string }[] = [];

  try {
    const categories = fs.readdirSync(contentDirectory);

    for (const category of categories) {
      const categoryPath = path.join(contentDirectory, category);
      if (fs.statSync(categoryPath).isDirectory()) {
        const files = fs.readdirSync(categoryPath);
        for (const file of files) {
          if (file.endsWith(".mdx")) {
            slugs.push({
              category,
              slug: file.replace(".mdx", ""),
            });
          }
        }
      }
    }
  } catch {
    // Content directory doesn't exist yet
  }

  return slugs;
}
