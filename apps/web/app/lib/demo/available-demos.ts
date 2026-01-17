// Registry of patterns that have interactive demos available

export const availableDemos = new Set([
  "caching/in-memory-cache",
  "api/validation",
  "api/rate-limiting",
  "api/error-handling",
  "monitoring/logging",
  "environment/type-safe-env",
  "auth/sessions",
]);

export function hasDemoAvailable(category: string, slug: string): boolean {
  return availableDemos.has(`${category}/${slug}`);
}

export function getAvailableDemosList(): { category: string; slug: string }[] {
  return Array.from(availableDemos).map((key) => {
    const [category, slug] = key.split("/");
    return { category: category ?? "", slug: slug ?? "" };
  });
}
