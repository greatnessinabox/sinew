import pc from "picocolors";
import prompts from "prompts";
import fs from "node:fs";
import path from "node:path";
import { getPattern, patterns, type Framework, type Pattern } from "@sinew/registry";

const CONFIG_FILE = "sinew.json";

interface SinewConfig {
  framework: Framework;
  paths: {
    lib: string;
  };
}

export async function add(patternArg?: string) {
  console.log(pc.bold("\n  sinew add\n"));

  // Load config
  const config = loadConfig();
  if (!config) {
    console.log(pc.red("  No sinew.json found. Run `sinew init` first.\n"));
    return;
  }

  let pattern: Pattern | undefined;

  if (patternArg) {
    // Parse pattern argument (e.g., "database/connection-pooling")
    const [category, slug] = patternArg.split("/");
    if (category && slug) {
      pattern = getPattern(category, slug);
    }

    if (!pattern) {
      console.log(pc.red(`  Pattern "${patternArg}" not found.\n`));
      console.log(pc.dim("  Run `sinew list` to see available patterns.\n"));
      return;
    }
  } else {
    // Interactive selection
    const { selectedPattern } = await prompts({
      type: "select",
      name: "selectedPattern",
      message: "Which pattern would you like to add?",
      choices: patterns.map((p) => ({
        title: `${p.category}/${p.slug}`,
        description: p.description,
        value: p,
      })),
    });

    if (!selectedPattern) {
      console.log(pc.yellow("  Aborted."));
      return;
    }

    pattern = selectedPattern;
  }

  // Check if framework is supported
  if (!pattern.frameworks.includes(config.framework)) {
    console.log(pc.yellow(`  This pattern doesn't support ${config.framework} yet.\n`));
    console.log(pc.dim(`  Supported frameworks: ${pattern.frameworks.join(", ")}\n`));
    return;
  }

  // Get files for the framework
  const files = pattern.files[config.framework];
  const deps = pattern.dependencies[config.framework];
  const devDeps = pattern.devDependencies?.[config.framework] ?? [];

  if (files.length === 0) {
    console.log(pc.yellow("  No files to add for this framework.\n"));
    return;
  }

  // Show what will be added
  console.log(pc.dim("  Files to add:"));
  for (const file of files) {
    const targetPath = file.path.startsWith(".")
      ? file.path
      : path.join(config.paths.lib, file.path);
    console.log(pc.dim(`    ${targetPath}`));
  }

  if (deps.length > 0) {
    console.log(pc.dim("\n  Dependencies:"));
    for (const dep of deps) {
      console.log(pc.dim(`    ${dep.name}${dep.version ? `@${dep.version}` : ""}`));
    }
  }

  if (devDeps.length > 0) {
    console.log(pc.dim("\n  Dev dependencies:"));
    for (const dep of devDeps) {
      console.log(pc.dim(`    ${dep.name}${dep.version ? `@${dep.version}` : ""}`));
    }
  }

  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: "Add this pattern?",
    initial: true,
  });

  if (!confirm) {
    console.log(pc.yellow("  Aborted."));
    return;
  }

  // Write files
  for (const file of files) {
    const targetPath = file.path.startsWith(".")
      ? path.join(process.cwd(), file.path)
      : path.join(process.cwd(), config.paths.lib, file.path);

    // Create directory if needed
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Check if file exists
    if (fs.existsSync(targetPath)) {
      const { overwrite } = await prompts({
        type: "confirm",
        name: "overwrite",
        message: `${path.relative(process.cwd(), targetPath)} already exists. Overwrite?`,
        initial: false,
      });

      if (!overwrite) {
        console.log(pc.dim(`  Skipped ${path.relative(process.cwd(), targetPath)}`));
        continue;
      }
    }

    fs.writeFileSync(targetPath, file.content);
    console.log(pc.green(`  Created ${path.relative(process.cwd(), targetPath)}`));
  }

  // Print dependency install commands
  if (deps.length > 0 || devDeps.length > 0) {
    console.log(pc.dim("\n  Install dependencies:"));

    if (deps.length > 0) {
      const depList = deps.map((d) => `${d.name}${d.version ? `@${d.version}` : ""}`).join(" ");
      console.log(pc.cyan(`    bun add ${depList}`));
    }

    if (devDeps.length > 0) {
      const devDepList = devDeps
        .map((d) => `${d.name}${d.version ? `@${d.version}` : ""}`)
        .join(" ");
      console.log(pc.cyan(`    bun add -D ${devDepList}`));
    }
  }

  console.log(pc.green("\n  Done!\n"));
}

function loadConfig(): SinewConfig | null {
  const configPath = path.join(process.cwd(), CONFIG_FILE);

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return null;
  }
}
