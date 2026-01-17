"use client";

export interface Prerequisite {
  name: string;
  version?: string;
  url?: string;
  description?: string;
}

interface PrerequisitesProps {
  prerequisites: Prerequisite[];
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function Prerequisites({ prerequisites }: PrerequisitesProps) {
  if (prerequisites.length === 0) return null;

  return (
    <div className="border-border bg-surface/30 rounded-lg border p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <svg className="text-accent h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        Prerequisites
      </h3>
      <ul className="space-y-2">
        {prerequisites.map((prereq, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
            <div className="text-sm">
              {prereq.url ? (
                <a
                  href={prereq.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-accent transition-colors"
                >
                  {prereq.name}
                  {prereq.version && <span className="text-muted ml-1">{prereq.version}</span>}
                </a>
              ) : (
                <span className="text-foreground">
                  {prereq.name}
                  {prereq.version && <span className="text-muted ml-1">{prereq.version}</span>}
                </span>
              )}
              {prereq.description && (
                <p className="text-muted mt-0.5 text-xs">{prereq.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
