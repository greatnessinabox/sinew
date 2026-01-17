import Link from "next/link";
import { hasDemoAvailable } from "@/app/lib/demo/available-demos";

interface DemoLinkProps {
  category: string;
  slug: string;
}

function PlayCircleIcon({ className }: { className?: string }) {
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

function BeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    </svg>
  );
}

export function DemoLink({ category, slug }: DemoLinkProps) {
  const available = hasDemoAvailable(category, slug);

  if (!available) {
    return (
      <div className="text-muted flex items-center gap-2 text-sm">
        <BeakerIcon className="h-4 w-4" />
        <span>Interactive demo coming soon</span>
      </div>
    );
  }

  return (
    <Link
      href={`/demo/${category}/${slug}`}
      className="border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 inline-flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors"
    >
      <PlayCircleIcon className="h-5 w-5" />
      <span className="font-medium">Try it Live</span>
      <span className="text-accent/60 text-sm">Interactive Demo</span>
    </Link>
  );
}
