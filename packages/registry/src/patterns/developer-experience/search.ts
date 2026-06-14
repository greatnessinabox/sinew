import type { Pattern } from "../../schema.js";

export const search: Pattern = {
  name: "Search",
  slug: "search",
  description:
    "Full-text search with typo tolerance, filters, and facets using Meilisearch. Includes indexing utilities, search hooks, and UI components.",
  category: "developer-experience",
  frameworks: ["nextjs"],
  tier: "freemium",
  complexity: "intermediate",
  tags: ["search", "meilisearch", "full-text", "filters", "facets"],
  alternatives: [
    {
      name: "Algolia",
      description: "Industry-leading search-as-a-service",
      url: "https://algolia.com",
      pricingTier: "freemium",
      pricingNote: "Free tier with 10K searches/month",
      advantages: ["Industry standard", "Excellent documentation", "InstantSearch UI libraries"],
    },
    {
      name: "Meilisearch",
      description: "Open-source, typo-tolerant search engine",
      url: "https://meilisearch.com",
      pricingTier: "freemium",
      pricingNote: "Free self-hosted, cloud from $30/month",
      advantages: ["Open source", "Easy to self-host", "Great typo tolerance", "Fast indexing"],
      recommended: true,
    },
    {
      name: "Typesense",
      description: "Open-source alternative to Algolia",
      url: "https://typesense.org",
      pricingTier: "freemium",
      advantages: ["Open source", "Algolia-like API", "Self-hostable", "Geographic search"],
    },
    {
      name: "Orama",
      description: "Full-text search that runs in the browser",
      url: "https://oramasearch.com",
      pricingTier: "free",
      advantages: [
        "Runs client-side",
        "No server required",
        "TypeScript-first",
        "Tiny bundle size",
      ],
    },
  ],
  files: {
    nextjs: [
      {
        path: "lib/search/client.ts",
        content: `import { MeiliSearch, Index } from "meilisearch";

// Admin client (master/admin key) for indexing and settings. Never expose this
// key to the browser.
const adminClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_API_KEY,
});

// Search client. Use a search-only key so query-time requests can't write or
// read keys. Falls back to the admin key only if a search key is not set.
const searchClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_SEARCH_API_KEY || process.env.MEILISEARCH_API_KEY,
});

// Index names
export const INDEXES = {
  products: "products",
  articles: "articles",
  users: "users",
} as const;

export type IndexName = (typeof INDEXES)[keyof typeof INDEXES];

// Attributes a user may filter, sort, or facet on, per index. This is the
// single source of truth shared with the indexing settings, and it is what
// guards the public search endpoint against scraping unintended fields.
export const indexAttributes: Record<
  IndexName,
  { filterable: string[]; sortable: string[] }
> = {
  products: {
    filterable: ["category", "brand", "price", "inStock"],
    sortable: ["price", "createdAt", "rating"],
  },
  articles: {
    filterable: ["author", "tags", "publishedAt", "category"],
    sortable: ["publishedAt", "views"],
  },
  users: {
    filterable: ["role", "createdAt"],
    sortable: ["createdAt", "name"],
  },
};

// Hard caps to prevent unbounded scraping / DoS via large pagination.
export const MAX_LIMIT = 50;
export const MAX_OFFSET = 10_000;

// Get index for admin/write operations.
export function getIndex<T extends Record<string, unknown>>(
  name: IndexName
): Index<T> {
  return adminClient.index<T>(name);
}

// Search options accepted from callers. Highlight tags are fixed server-side so
// clients can't inject arbitrary markup.
export interface SearchOptions {
  limit?: number;
  offset?: number;
  filter?: string | string[];
  sort?: string[];
  facets?: string[];
}

// Search results
export interface SearchResults<T> {
  hits: T[];
  query: string;
  processingTimeMs: number;
  estimatedTotalHits: number;
  facetDistribution?: Record<string, Record<string, number>>;
}

// Pull the attribute names referenced in a filter expression (or array of them)
// so they can be checked against the allowlist.
function attributesInFilter(filter: string | string[]): string[] {
  const expr = Array.isArray(filter) ? filter.join(" ") : filter;
  return Array.from(expr.matchAll(/([a-zA-Z_][\\w.]*)\\s*(?:=|!=|>=|<=|>|<|IN|TO|EXISTS|CONTAINS|STARTS WITH)/gi)).map(
    (m) => m[1]
  );
}

// Validate and clamp untrusted search options against the per-index allowlist.
// Anything outside the allowlist throws so the caller returns a 400 rather than
// leaking or scanning unintended attributes.
export function sanitizeSearchOptions(
  index: IndexName,
  options: SearchOptions
): SearchOptions {
  const allowed = indexAttributes[index];
  const limit = Math.min(Math.max(1, options.limit ?? 20), MAX_LIMIT);
  const offset = Math.min(Math.max(0, options.offset ?? 0), MAX_OFFSET);

  if (options.filter) {
    for (const attr of attributesInFilter(options.filter)) {
      if (!allowed.filterable.includes(attr)) {
        throw new Error(\`Filtering on "\${attr}" is not allowed\`);
      }
    }
  }

  if (options.sort) {
    for (const entry of options.sort) {
      const attr = entry.split(":")[0];
      if (!allowed.sortable.includes(attr)) {
        throw new Error(\`Sorting on "\${attr}" is not allowed\`);
      }
    }
  }

  const facets = options.facets?.filter((f) => allowed.filterable.includes(f));

  return {
    limit,
    offset,
    filter: options.filter,
    sort: options.sort,
    facets,
  };
}

// Generic search function. Untrusted options are sanitized before they reach
// Meilisearch.
export async function search<T extends Record<string, unknown>>(
  index: IndexName,
  query: string,
  options: SearchOptions = {}
): Promise<SearchResults<T>> {
  const safe = sanitizeSearchOptions(index, options);

  const results = await searchClient.index<T>(index).search(query, {
    limit: safe.limit,
    offset: safe.offset,
    filter: safe.filter,
    sort: safe.sort,
    facets: safe.facets,
    attributesToHighlight: ["*"],
    highlightPreTag: "<mark>",
    highlightPostTag: "</mark>",
  });

  return {
    hits: results.hits,
    query: results.query,
    processingTimeMs: results.processingTimeMs,
    estimatedTotalHits: results.estimatedTotalHits ?? results.hits.length,
    facetDistribution: results.facetDistribution,
  };
}

// Get Meilisearch client for admin operations
export function getClient() {
  return adminClient;
}
`,
      },
      {
        path: "lib/search/indexing.ts",
        content: `import {
  getClient,
  getIndex,
  indexAttributes,
  INDEXES,
  type IndexName,
} from "./client";

// Index settings type
interface IndexSettings {
  searchableAttributes?: string[];
  filterableAttributes?: string[];
  sortableAttributes?: string[];
  displayedAttributes?: string[];
  rankingRules?: string[];
  stopWords?: string[];
  synonyms?: Record<string, string[]>;
  distinctAttribute?: string;
}

// Default settings for each index. Filterable/sortable attributes come from the
// shared allowlist in client.ts so the search endpoint and the index settings
// can never drift apart.
const indexSettings: Record<IndexName, IndexSettings> = {
  products: {
    searchableAttributes: ["name", "description", "category", "brand"],
    filterableAttributes: indexAttributes.products.filterable,
    sortableAttributes: indexAttributes.products.sortable,
    displayedAttributes: ["*"],
  },
  articles: {
    searchableAttributes: ["title", "content", "author", "tags"],
    filterableAttributes: indexAttributes.articles.filterable,
    sortableAttributes: indexAttributes.articles.sortable,
    displayedAttributes: ["*"],
  },
  users: {
    searchableAttributes: ["name", "email", "bio"],
    filterableAttributes: indexAttributes.users.filterable,
    sortableAttributes: indexAttributes.users.sortable,
    displayedAttributes: ["id", "name", "email", "avatar", "role"],
  },
};

// Initialize index with settings
export async function initializeIndex(name: IndexName): Promise<void> {
  const client = getClient();
  const settings = indexSettings[name];

  // createIndex enqueues an async task. waitTask() blocks until it finishes so
  // the first run doesn't race settings/documents against index creation.
  await client.createIndex(name, { primaryKey: "id" }).waitTask();

  // Update settings
  const index = getIndex(name);
  await index.updateSettings(settings);

  console.log(\`Initialized index: \${name}\`);
}

// Initialize all indexes
export async function initializeAllIndexes(): Promise<void> {
  for (const name of Object.values(INDEXES)) {
    await initializeIndex(name);
  }
}

// Add documents to index
export async function addDocuments<T extends { id: string }>(
  index: IndexName,
  documents: T[]
): Promise<void> {
  const idx = getIndex<T>(index);
  await idx.addDocuments(documents);
}

// Update documents
export async function updateDocuments<T extends { id: string }>(
  index: IndexName,
  documents: T[]
): Promise<void> {
  const idx = getIndex<T>(index);
  await idx.updateDocuments(documents);
}

// Delete document
export async function deleteDocument(
  index: IndexName,
  id: string
): Promise<void> {
  const idx = getIndex(index);
  await idx.deleteDocument(id);
}

// Delete multiple documents
export async function deleteDocuments(
  index: IndexName,
  ids: string[]
): Promise<void> {
  const idx = getIndex(index);
  await idx.deleteDocuments(ids);
}

// Clear all documents from index
export async function clearIndex(index: IndexName): Promise<void> {
  const idx = getIndex(index);
  await idx.deleteAllDocuments();
}

// Get index stats
export async function getIndexStats(index: IndexName) {
  const idx = getIndex(index);
  return await idx.getStats();
}
`,
      },
      {
        path: "hooks/use-search.ts",
        content: `"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { SearchOptions, SearchResults } from "@/lib/search/client";

interface UseSearchOptions<T> extends SearchOptions {
  debounceMs?: number;
  initialQuery?: string;
  onResults?: (results: SearchResults<T>) => void;
}

export function useSearch<T extends Record<string, unknown>>(
  index: string,
  options: UseSearchOptions<T> = {}
) {
  const { debounceMs = 300, initialQuery = "", onResults, ...searchOptions } = options;

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults<T> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (!searchQuery.trim()) {
        setResults(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            index,
            query: searchQuery,
            ...searchOptions,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data: SearchResults<T> = await response.json();
        setResults(data);
        onResults?.(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Ignore abort errors
        }
        setError(err instanceof Error ? err : new Error("Search failed"));
      } finally {
        setIsLoading(false);
      }
    },
    [index, searchOptions, onResults]
  );

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    search: performSearch,
  };
}
`,
      },
      {
        path: "components/search-box.tsx",
        content: `"use client";

import { useSearch } from "@/hooks/use-search";
import { useState } from "react";

interface SearchBoxProps<T extends Record<string, unknown>> {
  index: string;
  placeholder?: string;
  onSelect?: (item: T) => void;
  renderResult?: (item: T, isHighlighted: boolean) => React.ReactNode;
  className?: string;
}

export function SearchBox<T extends Record<string, unknown>>({
  index,
  placeholder = "Search...",
  onSelect,
  renderResult,
  className = "",
}: SearchBoxProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const { query, setQuery, results, isLoading, error } = useSearch<T>(index);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results?.hits.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.hits.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          onSelect?.(results.hits[highlightedIndex]);
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={\`relative \${className}\`}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="search-results"
      />

      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {isOpen && results && results.hits.length > 0 && (
        <ul
          id="search-results"
          className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {results.hits.map((hit, index) => (
            <li
              key={(hit as { id?: string }).id ?? index}
              onClick={() => {
                onSelect?.(hit);
                setIsOpen(false);
              }}
              className={\`px-4 py-2 cursor-pointer \${
                index === highlightedIndex
                  ? "bg-blue-50"
                  : "hover:bg-gray-50"
              }\`}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              {renderResult ? (
                renderResult(hit, index === highlightedIndex)
              ) : (
                <span>{JSON.stringify(hit)}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOpen && query && results?.hits.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 p-4 bg-white border rounded-lg shadow-lg text-gray-500 text-center">
          No results found
        </div>
      )}

      {error && (
        <div className="absolute z-50 w-full mt-1 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error.message}
        </div>
      )}
    </div>
  );
}
`,
      },
      {
        path: "app/api/search/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { search, sanitizeSearchOptions, type IndexName, type SearchOptions, INDEXES } from "@/lib/search/client";

export async function POST(req: NextRequest) {
  let index: unknown;
  let query: unknown;
  let rawOptions: Record<string, unknown> = {};

  try {
    const body = await req.json();
    index = body.index;
    query = body.query;
    rawOptions = body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate index
  if (!Object.values(INDEXES).includes(index as IndexName)) {
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });
  }

  // Validate query
  if (typeof query !== "string") {
    return NextResponse.json({ error: "Query must be a string" }, { status: 400 });
  }

  // Only forward known option keys. Never spread the raw body into Meilisearch.
  const options: SearchOptions = {
    limit: typeof rawOptions.limit === "number" ? rawOptions.limit : undefined,
    offset: typeof rawOptions.offset === "number" ? rawOptions.offset : undefined,
    filter: rawOptions.filter as SearchOptions["filter"],
    sort: Array.isArray(rawOptions.sort) ? (rawOptions.sort as string[]) : undefined,
    facets: Array.isArray(rawOptions.facets) ? (rawOptions.facets as string[]) : undefined,
  };

  // Reject disallowed filter/sort attributes with a 400 before hitting search.
  try {
    sanitizeSearchOptions(index as IndexName, options);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid search options" },
      { status: 400 }
    );
  }

  try {
    const results = await search(index as IndexName, query, options);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
`,
      },
      {
        path: ".env.example",
        content: `# Meilisearch
# Self-hosted: http://localhost:7700
# Cloud: https://ms-xxx.meilisearch.io
MEILISEARCH_HOST="http://localhost:7700"

# Admin/master key. Server-side only, used for indexing and settings.
# Never expose this to the browser.
MEILISEARCH_API_KEY="your-master-key"

# Search-only key. Used by the /api/search route for query-time requests so the
# admin key is never used for searches. Generate one with the admin API.
MEILISEARCH_SEARCH_API_KEY="your-search-key"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "meilisearch", version: "^0.58.0" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
