import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getDemoConfig, getAllDemoConfigs } from "@/app/lib/demo/pattern-configs";
import { Playground } from "@/app/components/demo/playground";
import { DemoNavigator } from "@/app/components/demo/demo-navigator";

// Generate static params for all demos
export function generateStaticParams() {
  return getAllDemoConfigs().map((demo) => ({
    category: demo.category,
    slug: demo.slug,
  }));
}

// Generate metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const demo = getDemoConfig(category, slug);

  if (!demo) {
    return { title: "Demo Not Found" };
  }

  return {
    title: `${demo.title} Demo | Sinew Playground`,
    description: demo.description,
  };
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const demo = getDemoConfig(category, slug);
  const allDemos = getAllDemoConfigs();

  if (!demo) {
    notFound();
  }

  // Find current index and adjacent demos
  const currentIndex = allDemos.findIndex((d) => d.category === category && d.slug === slug);
  const prevDemo = currentIndex > 0 ? allDemos[currentIndex - 1] : null;
  const nextDemo = currentIndex < allDemos.length - 1 ? allDemos[currentIndex + 1] : null;

  // Get related demos from same category
  const relatedDemos = allDemos.filter((d) => d.category === category && d.slug !== slug);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Header */}
      <div className="border-border shrink-0 border-b px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/demo"
              className="text-muted hover:text-foreground flex items-center gap-1 text-sm transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Demos</span>
            </Link>
            <span className="text-border">/</span>
            <span className="text-muted text-sm capitalize">{category}</span>
            <span className="text-border">/</span>
            <h1 className="text-foreground text-sm font-semibold sm:text-base">{demo.title}</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Prev/Next Navigation */}
            <div className="flex items-center gap-1">
              {prevDemo ? (
                <Link
                  href={`/demo/${prevDemo.category}/${prevDemo.slug}`}
                  className="text-muted hover:text-foreground hover:bg-surface flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
                  title={prevDemo.title}
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                  <span className="hidden max-w-24 truncate md:inline">{prevDemo.title}</span>
                </Link>
              ) : (
                <span className="text-border px-2 py-1">
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                </span>
              )}
              {nextDemo ? (
                <Link
                  href={`/demo/${nextDemo.category}/${nextDemo.slug}`}
                  className="text-muted hover:text-foreground hover:bg-surface flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
                  title={nextDemo.title}
                >
                  <span className="hidden max-w-24 truncate md:inline">{nextDemo.title}</span>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="text-border px-2 py-1">
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </span>
              )}
            </div>

            <span className="bg-border hidden h-4 w-px sm:block" />

            <DemoNavigator demos={allDemos} currentCategory={category} currentSlug={slug} />

            <Link
              href={`/patterns/${category}/${slug}`}
              className="text-muted hover:text-accent flex items-center gap-1 text-xs transition-colors sm:gap-2 sm:text-sm"
            >
              <BookOpenIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Docs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Playground */}
      <div className="flex-1 overflow-hidden">
        <Playground demo={demo} />
      </div>

      {/* Related Demos Footer */}
      {relatedDemos.length > 0 && (
        <div className="border-border bg-surface/50 shrink-0 border-t px-4 py-2 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <span className="text-muted text-xs font-medium">Related:</span>
            <div className="flex flex-wrap gap-2">
              {relatedDemos.slice(0, 3).map((related) => (
                <Link
                  key={`${related.category}/${related.slug}`}
                  href={`/demo/${related.category}/${related.slug}`}
                  className="text-muted hover:text-accent bg-accent/5 hover:bg-accent/10 rounded px-2 py-1 text-xs transition-colors"
                >
                  {related.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
