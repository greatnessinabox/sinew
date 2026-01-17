import pc from "picocolors";
import { patterns } from "@sinew/registry";

export async function list() {
  console.log(pc.bold("\n  Available patterns\n"));

  // Group by category
  const grouped = patterns.reduce(
    (acc, pattern) => {
      if (!acc[pattern.category]) {
        acc[pattern.category] = [];
      }
      acc[pattern.category].push(pattern);
      return acc;
    },
    {} as Record<string, typeof patterns>
  );

  for (const [category, categoryPatterns] of Object.entries(grouped)) {
    console.log(pc.dim(`  ${category}/`));

    for (const pattern of categoryPatterns) {
      console.log(`    ${pc.cyan(pattern.slug)}`);
      console.log(pc.dim(`      ${pattern.description}`));
      console.log(pc.dim(`      Frameworks: ${pattern.frameworks.join(", ")}`));
      console.log();
    }
  }

  console.log(pc.dim(`  Run ${pc.bold("sinew add <category>/<pattern>")} to add a pattern.\n`));
}
