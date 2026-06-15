import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "../components/header";
import { FiberPattern } from "../components/fiber-pattern";

export const metadata: Metadata = {
  title: "Docs — sinew",
  description:
    "Install the sinew CLI, add infrastructure patterns you own, and keep them current with sinew audit.",
};

function CommandBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="border-border bg-surface/50 mt-3 overflow-x-auto rounded-lg border p-4 font-mono text-sm">
      <code>{children}</code>
    </pre>
  );
}

function Command({
  name,
  children,
  command,
}: {
  name: string;
  children: ReactNode;
  command: string;
}) {
  return (
    <div className="mt-8">
      <h3 className="font-mono text-lg font-semibold">
        sinew <span className="text-accent">{name}</span>
      </h3>
      <p className="text-muted mt-2">{children}</p>
      <CommandBlock>{command}</CommandBlock>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main id="main-content" className="relative" role="main">
        <FiberPattern opacity={0.08} density="normal" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 pt-32 pb-20">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Docs</h1>
          <p className="text-muted mt-4 text-lg leading-relaxed">
            Install the CLI, add the patterns you need, and keep them current. You own every line of
            code sinew gives you.
          </p>

          {/* Install */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold">Install</h2>
            <p className="text-muted mt-3">
              Install the CLI globally, or run any command through <code>npx</code>.
            </p>
            <CommandBlock>{`npm install -g @greatnessinabox/sinew

# or run without installing
npx @greatnessinabox/sinew <command>`}</CommandBlock>
          </section>

          {/* Commands */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold">Commands</h2>

            <Command name="init" command="sinew init">
              Set up sinew in your project. Creates a <code>sinew.json</code> with your framework
              and the path patterns should land in.
            </Command>

            <Command name="add" command="sinew add database/connection-pooling">
              Copy a pattern into your project. Files are written to your configured path and
              existing files are never overwritten without asking. The pattern is recorded in{" "}
              <code>sinew.lock</code> so audit can track it.
            </Command>

            <Command name="list" command="sinew list">
              Browse every available pattern, grouped by category.
            </Command>

            <Command name="audit" command="sinew audit">
              Check your copied patterns against the current registry, and flag anything that has
              changed upstream or been removed.
            </Command>
          </section>

          {/* Staying current */}
          <section className="mt-12" id="staying-current">
            <h2 className="text-2xl font-bold">Staying current</h2>
            <p className="text-muted mt-3 leading-relaxed">
              Copy-paste usually freezes you at the version you copied. Sinew doesn&apos;t.{" "}
              <span className="text-foreground font-medium">It remembers what it gave you.</span>
            </p>
            <p className="text-muted mt-3 leading-relaxed">
              <code>sinew add</code> records each pattern in a <code>sinew.lock</code> file (its
              framework, the CLI version, and a content hash). Run <code>sinew audit</code> anytime
              to see which copied patterns have drifted from the registry:
            </p>
            <CommandBlock>{`$ sinew audit

  ✓ database/connection-pooling (1.1.0)
  ↑ auth/sessions (added with 1.1.0, CLI is 1.2.0)

  1 outdated of 2 tracked.`}</CommandBlock>
            <p className="text-muted mt-3 leading-relaxed">
              Re-add a pattern to pull the latest. Nothing changes without you, so you keep full
              ownership of the code while still knowing when an upstream fix lands.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
