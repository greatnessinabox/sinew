import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getPattern, type Framework, type Pattern } from "@sinew/registry";

export const MANIFEST_FILE = "sinew.lock";

export interface ManifestEntry {
  framework: Framework;
  cliVersion: string;
  hash: string;
  addedAt: string;
}

export interface Manifest {
  version: number;
  patterns: Record<string, ManifestEntry>; // key = "category/slug"
}

function emptyManifest(): Manifest {
  return { version: 1, patterns: {} };
}

function isManifest(value: unknown): value is Manifest {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const patterns = (value as { patterns?: unknown }).patterns;
  return typeof patterns === "object" && patterns !== null && !Array.isArray(patterns);
}

// Deterministic content hash of a pattern's files for one framework, so audit
// can tell whether the upstream pattern changed since it was copied.
export function hashPattern(pattern: Pattern, framework: Framework): string {
  const canonical = (pattern.files[framework] ?? [])
    .map((f) => ({ path: f.path, content: f.content }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const digest = crypto.createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
  return `sha256:${digest}`;
}

export function readManifest(cwd: string): Manifest {
  const file = path.join(cwd, MANIFEST_FILE);
  if (!fs.existsSync(file)) {
    return emptyManifest();
  }
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf-8"));
    if (isManifest(parsed)) {
      return {
        version: typeof parsed.version === "number" ? parsed.version : 1,
        patterns: parsed.patterns,
      };
    }
  } catch {
    // Treat an unreadable manifest as empty rather than crashing.
  }
  return emptyManifest();
}

export function writeManifest(cwd: string, manifest: Manifest): void {
  const file = path.join(cwd, MANIFEST_FILE);
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
}

export function recordPattern(manifest: Manifest, key: string, entry: ManifestEntry): Manifest {
  return { ...manifest, patterns: { ...manifest.patterns, [key]: entry } };
}

export type AuditStatus = "current" | "outdated" | "removed";

export interface AuditResult {
  key: string;
  status: AuditStatus;
  entry: ManifestEntry;
}

// Compares each tracked pattern's recorded hash against the current bundled
// registry: "outdated" means the upstream pattern changed, "removed" means it
// no longer exists.
export function auditManifest(manifest: Manifest): AuditResult[] {
  return Object.entries(manifest.patterns).map(([key, entry]) => {
    const [category, slug] = key.split("/");
    const pattern = category && slug ? getPattern(category, slug) : undefined;
    if (!pattern) {
      return { key, status: "removed", entry };
    }
    const status = hashPattern(pattern, entry.framework) === entry.hash ? "current" : "outdated";
    return { key, status, entry };
  });
}
