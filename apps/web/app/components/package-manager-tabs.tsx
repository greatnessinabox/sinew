"use client";

import { useState, useEffect } from "react";

type PackageManager = "npm" | "pnpm" | "bun" | "yarn";

interface PackageManagerTabsProps {
  /** The package(s) to install, e.g., "@prisma/client" or "@prisma/client zod" */
  packages: string;
  /** Whether this is a dev dependency */
  dev?: boolean;
}

const STORAGE_KEY = "sinew-package-manager";

const commands: Record<PackageManager, { install: string; installDev: string; run: string }> = {
  npm: { install: "npm install", installDev: "npm install -D", run: "npx" },
  pnpm: { install: "pnpm add", installDev: "pnpm add -D", run: "pnpm dlx" },
  bun: { install: "bun add", installDev: "bun add -D", run: "bunx" },
  yarn: { install: "yarn add", installDev: "yarn add -D", run: "yarn dlx" },
};

export function PackageManagerTabs({ packages, dev = false }: PackageManagerTabsProps) {
  const [manager, setManager] = useState<PackageManager>("bun");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as PackageManager | null;
    if (stored && commands[stored]) {
      setManager(stored);
    }
  }, []);

  const handleSelect = (pm: PackageManager) => {
    setManager(pm);
    localStorage.setItem(STORAGE_KEY, pm);
  };

  const command = dev ? commands[manager].installDev : commands[manager].install;
  const fullCommand = `${command} ${packages}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-border bg-surface overflow-hidden rounded-lg border">
      {/* Tabs */}
      <div className="border-border bg-code-bg flex border-b">
        {(Object.keys(commands) as PackageManager[]).map((pm) => (
          <button
            key={pm}
            onClick={() => handleSelect(pm)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              manager === pm
                ? "text-accent border-accent -mb-px border-b-2"
                : "text-muted hover:text-foreground"
            }`}
          >
            {pm}
          </button>
        ))}
      </div>

      {/* Command */}
      <div className="flex items-center justify-between p-4 font-mono text-sm">
        <code>
          <span className="text-muted select-none">$ </span>
          <span className="text-foreground">{fullCommand}</span>
        </code>
        <button
          onClick={handleCopy}
          className="border-border hover:bg-border ml-4 rounded border px-3 py-1 text-xs transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

interface RunCommandProps {
  /** The command to run, e.g., "sinew add database/connection-pooling" */
  command: string;
}

export function RunCommand({ command }: RunCommandProps) {
  const [manager, setManager] = useState<PackageManager>("bun");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as PackageManager | null;
    if (stored && commands[stored]) {
      setManager(stored);
    }
  }, []);

  const handleSelect = (pm: PackageManager) => {
    setManager(pm);
    localStorage.setItem(STORAGE_KEY, pm);
  };

  const fullCommand = `${commands[manager].run} ${command}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-border bg-surface overflow-hidden rounded-lg border">
      {/* Tabs */}
      <div className="border-border bg-code-bg flex border-b">
        {(Object.keys(commands) as PackageManager[]).map((pm) => (
          <button
            key={pm}
            onClick={() => handleSelect(pm)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              manager === pm
                ? "text-accent border-accent -mb-px border-b-2"
                : "text-muted hover:text-foreground"
            }`}
          >
            {pm}
          </button>
        ))}
      </div>

      {/* Command */}
      <div className="flex items-center justify-between p-4 font-mono text-sm">
        <code>
          <span className="text-muted select-none">$ </span>
          <span className="text-foreground">{fullCommand}</span>
        </code>
        <button
          onClick={handleCopy}
          className="border-border hover:bg-border ml-4 rounded border px-3 py-1 text-xs transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
