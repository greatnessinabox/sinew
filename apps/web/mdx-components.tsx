import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mb-4 mt-8 text-3xl font-bold tracking-tight">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-8 text-2xl font-semibold tracking-tight">{children}</h2>
    ),
    h3: ({ children }) => <h3 className="mb-2 mt-6 text-xl font-semibold">{children}</h3>,
    p: ({ children }) => <p className="text-muted-foreground mb-4 leading-7">{children}</p>,
    code: ({ children }) => (
      <code className="bg-card rounded px-1.5 py-0.5 font-mono text-sm">{children}</code>
    ),
    pre: ({ children }) => (
      <pre className="bg-card border-border mb-4 overflow-x-auto rounded-lg border p-4">
        {children}
      </pre>
    ),
    ul: ({ children }) => (
      <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="text-muted-foreground mb-4 list-inside list-decimal space-y-1">{children}</ol>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-accent hover:underline"
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
    ...components,
  };
}
