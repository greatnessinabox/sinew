import Link from "next/link";

interface RelatedPattern {
  category: string;
  slug: string;
  name: string;
  relationship: "works-with" | "conflicts-with" | "extends" | "alternative";
}

interface RelatedPatternsProps {
  patterns: RelatedPattern[];
}

const relationshipLabels: Record<RelatedPattern["relationship"], { label: string; color: string }> =
  {
    "works-with": { label: "Works well with", color: "text-green-400" },
    "conflicts-with": { label: "Conflicts with", color: "text-red-400" },
    extends: { label: "Extends", color: "text-blue-400" },
    alternative: { label: "Alternative to", color: "text-yellow-400" },
  };

function WorksWithIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function ConflictsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function ExtendsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function AlternativeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      />
    </svg>
  );
}

function getIcon(relationship: RelatedPattern["relationship"]) {
  switch (relationship) {
    case "works-with":
      return WorksWithIcon;
    case "conflicts-with":
      return ConflictsIcon;
    case "extends":
      return ExtendsIcon;
    case "alternative":
      return AlternativeIcon;
  }
}

export function RelatedPatterns({ patterns }: RelatedPatternsProps) {
  if (patterns.length === 0) return null;

  // Group by relationship type
  const grouped = patterns.reduce(
    (acc, pattern) => {
      if (!acc[pattern.relationship]) {
        acc[pattern.relationship] = [];
      }
      acc[pattern.relationship].push(pattern);
      return acc;
    },
    {} as Record<RelatedPattern["relationship"], RelatedPattern[]>
  );

  return (
    <div className="border-border bg-surface/30 space-y-4 rounded-lg border p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <WorksWithIcon className="text-accent h-4 w-4" />
        Related Patterns
      </h3>

      {Object.entries(grouped).map(([relationship, relatedPatterns]) => {
        const config = relationshipLabels[relationship as RelatedPattern["relationship"]];
        const Icon = getIcon(relationship as RelatedPattern["relationship"]);

        return (
          <div key={relationship}>
            <p className={`text-xs font-medium ${config.color} mb-2 flex items-center gap-1.5`}>
              <Icon className="h-3.5 w-3.5" />
              {config.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {relatedPatterns.map((pattern) => (
                <Link
                  key={`${pattern.category}/${pattern.slug}`}
                  href={`/patterns/${pattern.category}/${pattern.slug}`}
                  className="bg-background border-border text-muted hover:text-foreground hover:border-accent/40 rounded-md border px-3 py-1.5 text-sm transition-colors"
                >
                  {pattern.name}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
