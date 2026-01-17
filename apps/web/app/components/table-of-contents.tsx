"use client";

import { useEffect, useState } from "react";

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    );

    // Observe all section headings
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="fixed right-8 top-32 hidden w-56 xl:block" aria-label="Table of contents">
      <div className="border-border border-l pl-4">
        <p className="text-muted mb-4 text-xs font-semibold uppercase tracking-wider">
          On this page
        </p>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(item.id);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                    setActiveId(item.id);
                    // Update URL without scrolling
                    window.history.pushState(null, "", `#${item.id}`);
                  }
                }}
                className={`block text-sm transition-colors ${
                  activeId === item.id
                    ? "text-accent font-medium"
                    : "text-muted hover:text-foreground"
                } ${item.level > 2 ? "pl-3" : ""}`}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

// Helper to extract TOC items from content sections
export function extractTOCItems(sections: { title: string }[]): TOCItem[] {
  return sections.map((section) => ({
    id: toSlug(section.title),
    title: section.title,
    level: 2,
  }));
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
