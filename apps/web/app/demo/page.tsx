import Link from "next/link";
import { getAllDemoConfigs } from "@/app/lib/demo/pattern-configs";

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    caching: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z",
    api: "M13 10V3L4 14h7v7l9-11h-7z",
    monitoring: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6",
    environment:
      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    auth: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  };
  return icons[category] ?? icons.api;
}

const categoryLabels: Record<string, string> = {
  caching: "Caching",
  api: "API",
  monitoring: "Monitoring",
  environment: "Environment",
  auth: "Authentication",
};

export default function DemoIndexPage() {
  const demos = getAllDemoConfigs();

  // Group by category
  const grouped = demos.reduce<Record<string, typeof demos>>((acc, demo) => {
    const category = demo.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category]!.push(demo);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      {/* Hero */}
      <div className="mb-16 max-w-3xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="bg-accent/10 text-accent rounded-full px-3 py-1 text-sm font-medium">
            Interactive
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Pattern Playground</h1>
        <p className="text-muted mt-4 text-lg leading-relaxed">
          Experience Sinew patterns in action. Each demo lets you interact with real code, see
          step-by-step explanations, and watch live logs as operations execute.
        </p>
      </div>

      {/* Demo Grid */}
      <div className="space-y-12">
        {Object.entries(grouped).map(([category, categoryDemos]) => (
          <section key={category}>
            <h2 className="text-muted mb-6 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={getCategoryIcon(category)}
                />
              </svg>
              {categoryLabels[category] ?? category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryDemos.map((demo) => (
                <Link
                  key={`${demo.category}/${demo.slug}`}
                  href={`/demo/${demo.category}/${demo.slug}`}
                  className="border-border bg-surface/30 hover:border-accent/40 hover:bg-surface/50 group relative rounded-xl border p-6 transition-all"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="text-foreground group-hover:text-accent font-semibold transition-colors">
                      {demo.title}
                    </h3>
                    <PlayIcon className="text-muted group-hover:text-accent h-5 w-5 transition-colors" />
                  </div>
                  <p className="text-muted mb-4 text-sm leading-relaxed">{demo.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted">
                      {demo.actions.length} action{demo.actions.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-muted">
                      {demo.steps.length} step{demo.steps.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {/* Hover gradient */}
                  <div className="from-accent/5 pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Coming Soon */}
      <section className="border-border mt-16 rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted">
          More interactive demos coming soon. Want to see a specific pattern?{" "}
          <a
            href="https://github.com/sinewjs/sinew/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Let us know
          </a>
          .
        </p>
      </section>
    </div>
  );
}
