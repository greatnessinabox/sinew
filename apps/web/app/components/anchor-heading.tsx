"use client";

import { useState, type JSX } from "react";

interface AnchorHeadingProps {
  id: string;
  level?: 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function AnchorHeading({ id, level = 2, children, className = "" }: AnchorHeadingProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.history.pushState({}, "", `#${id}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag id={id} className={`group/anchor ${className}`}>
      {children}
      <a
        href={`#${id}`}
        onClick={handleClick}
        className="text-muted hover:text-accent ml-2 inline-flex items-center opacity-0 transition-all group-hover/anchor:opacity-100"
        aria-label={`Copy link to section`}
      >
        {copied ? (
          <span className="text-accent text-xs font-normal">copied!</span>
        ) : (
          <LinkIcon className="h-4 w-4" />
        )}
      </a>
    </Tag>
  );
}
