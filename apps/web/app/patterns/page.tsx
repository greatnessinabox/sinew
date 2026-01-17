import { FiberPatternStatic, FiberCorner } from "@/app/components/fiber-pattern";
import { Header } from "@/app/components/header";
import { PatternFilters } from "@/app/components/pattern-filters";
import { patterns, getAllCategories } from "@/app/lib/patterns";

export default function PatternsPage() {
  const categories = getAllCategories();

  return (
    <div className="relative min-h-screen">
      {/* Background fibers */}
      <FiberPatternStatic opacity={0.06} />
      <FiberCorner position="top-right" className="opacity-40" />
      <FiberCorner position="bottom-left" className="opacity-30" />

      <Header />

      <main
        id="main-content"
        className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-24"
        role="main"
      >
        <div className="mb-12 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight">Patterns</h1>
          <p className="text-muted mt-4 text-lg">
            Production-ready infrastructure code. Copy what you need, customize as required.
          </p>
        </div>

        <PatternFilters patterns={patterns} categories={categories} />
      </main>

      {/* Footer */}
      <footer className="border-border border-t" role="contentinfo">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-muted text-sm">
            Built by{" "}
            <a
              href="https://marquis.codes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-accent transition-colors"
            >
              marquis.codes
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
