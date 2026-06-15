import fs from "node:fs";
import path from "node:path";
import type { Framework } from "@sinew/registry";

export const CONFIG_FILE = "sinew.json";

export interface SinewConfig {
  framework: Framework;
  paths: {
    lib: string;
  };
}

export function loadConfig(): SinewConfig | null {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8")) as SinewConfig;
  } catch {
    return null;
  }
}

// Maps a pattern file's registry path to its project-relative destination,
// applying the configured lib path. Shared by `add` and `update`.
// ponytail: add.ts still has its own copy; dedupe in a separate refactor.
export function relativeTargetPath(filePath: string, libPath: string): string {
  if (filePath.startsWith(".")) {
    return filePath; // dotfiles/dirs stay at the project root
  }
  if (filePath.startsWith("lib/")) {
    return filePath.replace(/^lib\//, `${libPath}/`);
  }
  if (
    !filePath.includes("/") || // root-level files (Dockerfile, vercel.json)
    filePath.startsWith("app/") ||
    filePath.startsWith("e2e/") ||
    filePath.startsWith("tests/") ||
    filePath.startsWith("prisma/") ||
    filePath.startsWith("emails/") ||
    /^[^/]+\.config\.(ts|js|mjs)$/.test(filePath)
  ) {
    return filePath;
  }
  return path.join(libPath, filePath);
}
