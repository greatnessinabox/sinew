import pc from "picocolors";
import fs from "node:fs";
import path from "node:path";
import { getPattern } from "@sinew/registry";
import {
  auditManifest,
  hashPattern,
  readManifest,
  writeManifest,
  recordPattern,
  MANIFEST_FILE,
} from "../manifest.js";
import { loadConfig, relativeTargetPath } from "../project.js";
import pkg from "../../package.json" with { type: "json" };

export async function update(patternArg?: string) {
  console.log(pc.bold("\n  sinew update\n"));

  const config = loadConfig();
  if (!config) {
    console.log(pc.red("  No sinew.json found. Run `sinew init` first.\n"));
    return;
  }

  const manifest = readManifest(process.cwd());
  if (Object.keys(manifest.patterns).length === 0) {
    console.log(pc.dim(`  No tracked patterns (${MANIFEST_FILE} is empty or missing).\n`));
    return;
  }

  let targets = auditManifest(manifest).filter((r) => r.status === "outdated");
  if (patternArg) {
    targets = targets.filter((r) => r.key === patternArg);
    if (targets.length === 0) {
      console.log(pc.dim(`  ${patternArg} is not outdated (or not tracked).\n`));
      return;
    }
  }

  if (targets.length === 0) {
    console.log(pc.green("  Everything is up to date.\n"));
    return;
  }

  let stagedTotal = 0;

  for (const target of targets) {
    const [category, slug] = target.key.split("/");
    const pattern = category && slug ? getPattern(category, slug) : undefined;
    if (!pattern) {
      continue;
    }

    const framework = target.entry.framework;
    console.log(pc.bold(`  ${target.key}`));

    let patternStaged = 0;
    for (const file of pattern.files[framework] ?? []) {
      const rel = relativeTargetPath(file.path, config.paths.lib);
      const abs = path.join(process.cwd(), rel);

      if (!fs.existsSync(abs)) {
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, file.content);
        console.log(pc.green(`    + ${rel} (new)`));
        continue;
      }

      if (fs.readFileSync(abs, "utf-8") === file.content) {
        console.log(pc.dim(`    = ${rel} (unchanged)`));
        continue;
      }

      // Never clobber the user's copy; stage the new version beside it.
      fs.writeFileSync(`${abs}.new`, file.content);
      patternStaged++;
      console.log(pc.yellow(`    ~ ${rel} -> ${rel}.new`));
    }

    // Mark the pattern current only once nothing is left to merge, so audit
    // keeps flagging it until the .new files are folded in and update re-run.
    if (patternStaged === 0) {
      writeManifest(
        process.cwd(),
        recordPattern(readManifest(process.cwd()), target.key, {
          framework,
          cliVersion: pkg.version,
          hash: hashPattern(pattern, framework),
          addedAt: target.entry.addedAt,
        })
      );
    }
    stagedTotal += patternStaged;
    console.log("");
  }

  if (stagedTotal > 0) {
    console.log(
      pc.yellow(
        `  ${stagedTotal} file(s) staged as .new next to your copy. Diff, merge, delete the .new, then re-run sinew update.\n`
      )
    );
  } else {
    console.log(pc.green("  Patterns updated. Run sinew audit to confirm.\n"));
  }
}
