"use client";

import { useState, useMemo } from "react";

interface FileChange {
  path: string;
  type: "create" | "modify" | "append";
  language?: string;
}

interface RawFile {
  path: string;
  content?: string;
  language?: string;
}

interface DiffPreviewProps {
  /** Raw files from pattern - will be converted to FileChange format */
  files: RawFile[];
  command: string;
}

function FileIcon({ type }: { type: FileChange["type"] }) {
  if (type === "create") {
    return (
      <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    );
  }
  if (type === "modify") {
    return (
      <svg
        className="h-4 w-4 text-yellow-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function ChevronIcon({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      className={`${className} transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function getLanguageFromPath(path: string): string {
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".yml") || path.endsWith(".yaml")) return "yaml";
  if (path.endsWith(".md") || path.endsWith(".mdx")) return "markdown";
  if (path.endsWith(".prisma")) return "prisma";
  if (path.includes("Dockerfile")) return "dockerfile";
  return "text";
}

export function DiffPreview({ files: rawFiles, command }: DiffPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Transform raw files to FileChange format
  const files = useMemo<FileChange[]>(() => {
    return rawFiles.map((file) => ({
      path: file.path,
      type: "create" as const,
      language: file.language || getLanguageFromPath(file.path),
    }));
  }, [rawFiles]);

  const createCount = files.filter((f) => f.type === "create").length;
  const modifyCount = files.filter((f) => f.type === "modify").length;

  return (
    <div className="border-border bg-surface/30 overflow-hidden rounded-lg border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-surface/50 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <ChevronIcon className="text-muted h-4 w-4" open={isOpen} />
          <span className="text-sm font-medium">Preview Changes</span>
          <div className="text-muted flex items-center gap-2 text-xs">
            {createCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                {createCount} new
              </span>
            )}
            {modifyCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                {modifyCount} modified
              </span>
            )}
          </div>
        </div>
        <code className="text-muted hidden font-mono text-xs sm:block">{command}</code>
      </button>

      {isOpen && (
        <div className="border-border border-t">
          <div className="space-y-2 p-4">
            <p className="text-muted mb-3 text-xs">
              Running this command will create or modify the following files:
            </p>
            {files.map((file, i) => (
              <div
                key={i}
                className="bg-background border-border flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <FileIcon type={file.type} />
                <span className="flex-1 font-mono text-sm">{file.path}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    file.type === "create"
                      ? "bg-green-500/10 text-green-400"
                      : file.type === "modify"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {file.type}
                </span>
              </div>
            ))}
          </div>

          <div className="border-border bg-surface/50 border-t px-4 py-3">
            <div className="text-muted flex items-center gap-2 text-xs">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Files are created relative to your project root. Existing files will not be
                overwritten without confirmation.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
