import pc from "picocolors";
import { auditManifest, readManifest, MANIFEST_FILE } from "../manifest.js";
import pkg from "../../package.json" with { type: "json" };

export async function audit() {
  console.log(pc.bold("\n  sinew audit\n"));

  const manifest = readManifest(process.cwd());
  if (Object.keys(manifest.patterns).length === 0) {
    console.log(pc.dim(`  No tracked patterns (${MANIFEST_FILE} is empty or missing).`));
    console.log(pc.dim("  Run `sinew add <pattern>` to start tracking.\n"));
    return;
  }

  const results = auditManifest(manifest);

  for (const r of results) {
    if (r.status === "current") {
      console.log(`  ${pc.green("✓")} ${r.key} ${pc.dim(`(${r.entry.cliVersion})`)}`);
    } else if (r.status === "outdated") {
      console.log(
        `  ${pc.yellow("↑")} ${r.key} ${pc.dim(`(added with ${r.entry.cliVersion}, CLI is ${pkg.version})`)}`
      );
    } else {
      console.log(`  ${pc.red("✗")} ${r.key} ${pc.dim("(no longer in the registry)")}`);
    }
  }

  const outdated = results.filter((r) => r.status === "outdated").length;
  const removed = results.filter((r) => r.status === "removed").length;

  console.log();
  if (outdated === 0 && removed === 0) {
    console.log(pc.green(`  All ${results.length} tracked pattern(s) are up to date.\n`));
    return;
  }

  const parts = [outdated && `${outdated} outdated`, removed && `${removed} removed`].filter(
    Boolean
  );
  console.log(pc.yellow(`  ${parts.join(", ")} of ${results.length} tracked.`));
  console.log(pc.dim(`  Re-add a pattern to pull the latest: ${pc.bold("sinew add <pattern>")}\n`));
}
