import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PackageManagerTabs, RunCommand } from "@/app/components/package-manager-tabs";
import { FiberPatternStatic, FiberCorner } from "@/app/components/fiber-pattern";
import { AlternativesCard } from "@/app/components/alternatives-card";
import { CodeBlock } from "@/app/components/code-block";
import { Header } from "@/app/components/header";
import { TestedBadge } from "@/app/components/tested-badge";
import { AnchorHeading } from "@/app/components/anchor-heading";
import { TableOfContents } from "@/app/components/table-of-contents";
import { DiffPreview } from "@/app/components/diff-preview";
import { Prerequisites } from "@/app/components/prerequisites";
import { TestedWith } from "@/app/components/tested-with";
import { RelatedPatterns } from "@/app/components/related-patterns";
import { CopyPath } from "@/app/components/copy-path";
import { DemoLink } from "@/app/components/demo/demo-link";
import { patterns, getPattern } from "@/app/lib/patterns";
import { getPatternContent, type ContentSection } from "@/app/lib/content";

// Generate static params for all patterns at build time
export function generateStaticParams() {
  return patterns.map((pattern) => ({
    category: pattern.category,
    slug: pattern.slug,
  }));
}

// Generate metadata for each pattern
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const pattern = getPattern(category, slug);

  if (!pattern) {
    return { title: "Pattern Not Found" };
  }

  return {
    title: `${pattern.name} | Sinew`,
    description: pattern.description,
  };
}

// Format category name for display
function formatCategory(category: string): string {
  const categoryNames: Record<string, string> = {
    database: "Database",
    auth: "Authentication",
    environment: "Environment",
    deployment: "Deployment",
    api: "API",
    testing: "Testing",
    caching: "Caching",
    email: "Email",
    payments: "Payments",
    monitoring: "Monitoring",
  };
  return categoryNames[category] || category;
}

// Format complexity badge
function ComplexityBadge({ complexity }: { complexity?: string }) {
  if (!complexity) return null;

  const colors = {
    beginner: "bg-green-500/10 text-green-400",
    intermediate: "bg-yellow-500/10 text-yellow-400",
    advanced: "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${colors[complexity as keyof typeof colors] || ""}`}
    >
      {complexity}
    </span>
  );
}

// Format inline text with code and bold support
function formatInlineText(text: string, keyPrefix = "") {
  return text.split(/(`[^`]+`)/).map((segment, j) => {
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <code
          key={`${keyPrefix}${j}`}
          className="bg-surface text-accent rounded px-1.5 py-0.5 font-mono text-sm"
        >
          {segment.slice(1, -1)}
        </code>
      );
    }
    return segment.split(/(\*\*[^*]+\*\*)/).map((boldSegment, k) => {
      if (boldSegment.startsWith("**") && boldSegment.endsWith("**")) {
        return (
          <strong key={`${keyPrefix}${j}-${k}`} className="text-foreground">
            {boldSegment.slice(2, -2)}
          </strong>
        );
      }
      return boldSegment;
    });
  });
}

// Render markdown-like content with basic formatting
function MarkdownContent({ content }: { content: string }) {
  const parts = content.split(/\n\n+/);

  return (
    <div className="space-y-4">
      {parts.map((part, i) => {
        const trimmed = part.trim();
        if (!trimmed) return null;

        // Check for unordered list
        if (trimmed.match(/^[-*]\s/m)) {
          const items = trimmed.split(/\n/).filter((line) => line.match(/^[-*]\s/));
          return (
            <ul key={i} className="space-y-2">
              {items.map((item, j) => (
                <li key={j} className="flex gap-3">
                  <span className="bg-accent mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                  <span className="text-muted">
                    {formatInlineText(item.replace(/^[-*]\s+/, ""), `${i}-${j}-`)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        // Check for ordered list
        if (trimmed.match(/^\d+\.\s/m)) {
          const items = trimmed.split(/\n/).filter((line) => line.match(/^\d+\.\s/));
          return (
            <ol key={i} className="list-inside list-decimal space-y-2">
              {items.map((item, j) => (
                <li key={j} className="text-muted">
                  {formatInlineText(item.replace(/^\d+\.\s+/, ""), `${i}-${j}-`)}
                </li>
              ))}
            </ol>
          );
        }

        // Check for h3
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="text-foreground mt-6 text-lg font-semibold">
              {formatInlineText(trimmed.replace(/^###\s+/, ""), `${i}-`)}
            </h3>
          );
        }

        return (
          <p key={i} className="text-muted leading-relaxed">
            {formatInlineText(trimmed, `${i}-`)}
          </p>
        );
      })}
    </div>
  );
}

// Convert title to URL-friendly slug
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Render a content section with parts (text and code blocks in order)
function SectionRenderer({ section, stepNumber }: { section: ContentSection; stepNumber: number }) {
  const sectionId = toSlug(section.title);

  return (
    <section className="mt-16">
      <AnchorHeading id={sectionId} className="flex items-center gap-3 text-2xl font-semibold">
        <span className="bg-accent/10 text-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
          {stepNumber}
        </span>
        <span>{section.title}</span>
      </AnchorHeading>
      <div className="mt-6 space-y-6 pl-11">
        {section.parts.map((part, i) =>
          part.type === "text" ? (
            <MarkdownContent key={i} content={part.content} />
          ) : (
            <CodeBlock key={i} code={part.content} language={part.language || "typescript"} />
          )
        )}
      </div>
    </section>
  );
}

export default async function PatternPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const pattern = getPattern(category, slug);

  if (!pattern) {
    notFound();
  }

  // Load MDX content if available
  const content = await getPatternContent(category, slug);
  const files = content?.files || [];
  const dependencies = pattern.dependencies || [];
  const devDependencies = pattern.devDependencies || [];

  // Calculate step numbers dynamically
  let stepNumber = 0;

  // Generate TOC items from content sections
  const tocItems: { id: string; title: string; level: number }[] = [];
  if (content?.problem) {
    tocItems.push({ id: toSlug(content.problem.title), title: content.problem.title, level: 2 });
  }
  if (content?.solution) {
    tocItems.push({ id: toSlug(content.solution.title), title: content.solution.title, level: 2 });
  }
  if (files.length > 0) {
    tocItems.push({ id: "files", title: "Files", level: 2 });
  }
  if (dependencies.length > 0 || devDependencies.length > 0) {
    tocItems.push({ id: "dependencies", title: "Dependencies", level: 2 });
  }
  if (content?.configuration) {
    tocItems.push({
      id: toSlug(content.configuration.title),
      title: content.configuration.title,
      level: 2,
    });
  }
  if (content?.usage) {
    tocItems.push({ id: toSlug(content.usage.title), title: content.usage.title, level: 2 });
  }
  if (content?.troubleshooting) {
    tocItems.push({
      id: toSlug(content.troubleshooting.title),
      title: content.troubleshooting.title,
      level: 2,
    });
  }
  content?.additionalSections.forEach((section) => {
    tocItems.push({ id: toSlug(section.title), title: section.title, level: 2 });
  });

  return (
    <div className="relative min-h-screen">
      {/* Background fibers */}
      <FiberPatternStatic opacity={0.05} />
      <FiberCorner position="top-right" className="opacity-30" />

      <Header />

      {/* Table of Contents */}
      <TableOfContents items={tocItems} />

      <main
        id="main-content"
        className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-24"
        role="main"
      >
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-muted flex items-center gap-2 text-sm">
          <Link href="/patterns" className="hover:text-foreground transition-colors">
            Patterns
          </Link>
          <span className="text-border" aria-hidden="true">
            /
          </span>
          <Link href="/patterns" className="hover:text-foreground transition-colors">
            {formatCategory(category)}
          </Link>
          <span className="text-border" aria-hidden="true">
            /
          </span>
          <span className="text-foreground" aria-current="page">
            {pattern.name}
          </span>
        </nav>

        {/* Title */}
        <div className="mt-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">{pattern.name}</h1>
              <ComplexityBadge complexity={pattern.complexity} />
              {pattern.alternatives && pattern.alternatives.length > 0 && (
                <span className="text-sm text-amber-400" title="Paid alternatives available">
                  *
                </span>
              )}
            </div>
            <p className="text-muted mt-4 text-lg leading-relaxed">{pattern.description}</p>
          </div>
        </div>

        {/* Tags */}
        {pattern.tags && pattern.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {pattern.tags.map((tag) => (
              <span
                key={tag}
                className="bg-surface border-border text-muted rounded-full border px-2 py-1 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Tested badge */}
        <div className="mt-4">
          <TestedBadge />
        </div>

        {/* CLI */}
        <div className="mt-8">
          <RunCommand command={`sinew add ${category}/${slug}`} />
        </div>

        {/* Interactive Demo Link */}
        <div className="mt-4">
          <DemoLink category={category} slug={slug} />
        </div>

        {/* Diff Preview */}
        {files.length > 0 && (
          <div className="mt-4">
            <DiffPreview files={files} command={`sinew add ${category}/${slug}`} />
          </div>
        )}

        {/* Sidebar Components */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {/* Prerequisites */}
          {pattern.prerequisites && pattern.prerequisites.length > 0 && (
            <Prerequisites prerequisites={pattern.prerequisites} />
          )}

          {/* Tested With */}
          {pattern.testedWith && pattern.testedWith.length > 0 && (
            <TestedWith items={pattern.testedWith} />
          )}
        </div>

        {/* Related Patterns */}
        {pattern.relatedPatterns && pattern.relatedPatterns.length > 0 && (
          <div className="mt-4">
            <RelatedPatterns patterns={pattern.relatedPatterns} />
          </div>
        )}

        {/* Alternatives (if any) */}
        {pattern.alternatives && pattern.alternatives.length > 0 && (
          <AlternativesCard alternatives={pattern.alternatives} />
        )}

        {/* The Problem */}
        {content?.problem && (
          <SectionRenderer section={content.problem} stepNumber={++stepNumber} />
        )}

        {/* The Solution */}
        {content?.solution && (
          <SectionRenderer section={content.solution} stepNumber={++stepNumber} />
        )}

        {/* Files */}
        {files.length > 0 && (
          <section id="files" className="mt-16 scroll-mt-24">
            <h2 className="flex items-center gap-3 text-2xl font-semibold">
              <span className="bg-accent/10 text-accent flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                {++stepNumber}
              </span>
              Files
            </h2>
            <div className="mt-8 space-y-8 pl-11">
              {files.map((file) => (
                <div key={file.path}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-accent font-mono text-sm font-medium">{file.path}</h3>
                    <CopyPath path={file.path} />
                  </div>
                  <CodeBlock code={file.content} language={file.language} filename={file.path} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dependencies */}
        {(dependencies.length > 0 || devDependencies.length > 0) && (
          <section id="dependencies" className="mt-16 scroll-mt-24">
            <h2 className="flex items-center gap-3 text-2xl font-semibold">
              <span className="bg-accent/10 text-accent flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                {++stepNumber}
              </span>
              Dependencies
            </h2>
            <div className="mt-6 space-y-4 pl-11">
              {dependencies.length > 0 && (
                <PackageManagerTabs packages={dependencies.map((d) => d.name).join(" ")} />
              )}
              {devDependencies.length > 0 && (
                <PackageManagerTabs packages={devDependencies.map((d) => d.name).join(" ")} dev />
              )}
            </div>
          </section>
        )}

        {/* Configuration */}
        {content?.configuration && (
          <SectionRenderer section={content.configuration} stepNumber={++stepNumber} />
        )}

        {/* Usage */}
        {content?.usage && <SectionRenderer section={content.usage} stepNumber={++stepNumber} />}

        {/* Troubleshooting */}
        {content?.troubleshooting && (
          <SectionRenderer section={content.troubleshooting} stepNumber={++stepNumber} />
        )}

        {/* Additional Sections */}
        {content?.additionalSections.map((section) => (
          <SectionRenderer key={section.title} section={section} stepNumber={++stepNumber} />
        ))}

        {/* No content yet message */}
        {!content && (
          <section className="border-border bg-surface/50 mt-16 rounded-xl border p-8 text-center">
            <p className="text-muted">Documentation for this pattern is coming soon.</p>
            <p className="text-muted/70 mt-2 text-sm">
              In the meantime, use the CLI command above to add this pattern to your project.
            </p>
          </section>
        )}

        {/* Related Patterns */}
        <section className="border-border mt-16 border-t pt-12">
          <h2 className="text-xl font-semibold">Related patterns</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {patterns
              .filter((p) => p.category === category && p.slug !== slug)
              .slice(0, 3)
              .map((related) => (
                <Link
                  key={related.slug}
                  href={`/patterns/${related.category}/${related.slug}`}
                  className="bg-surface border-border text-muted hover:text-foreground hover:border-accent/40 rounded-lg border px-3 py-1.5 text-sm transition-colors"
                >
                  {related.name}
                </Link>
              ))}
          </div>
        </section>
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
