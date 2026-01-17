import pc from "picocolors";
import prompts from "prompts";
import fs from "node:fs";
import path from "node:path";
import type { Framework } from "@sinew/registry";

const CONFIG_FILE = "sinew.json";

interface SinewConfig {
  framework: Framework;
  paths: {
    lib: string;
  };
}

export async function init() {
  console.log(pc.bold("\n  sinew init\n"));

  // Check if config already exists
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  if (fs.existsSync(configPath)) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: "sinew.json already exists. Overwrite?",
      initial: false,
    });

    if (!overwrite) {
      console.log(pc.yellow("  Aborted."));
      return;
    }
  }

  // Detect framework
  const detectedFramework = detectFramework();

  const response = await prompts([
    {
      type: "select",
      name: "framework",
      message: "Which framework are you using?",
      choices: [
        { title: "Next.js", value: "nextjs" },
        { title: "Remix", value: "remix" },
        { title: "SvelteKit", value: "sveltekit" },
        { title: "Nuxt", value: "nuxt" },
      ],
      initial: detectedFramework
        ? ["nextjs", "remix", "sveltekit", "nuxt"].indexOf(detectedFramework)
        : 0,
    },
    {
      type: "text",
      name: "libPath",
      message: "Where should lib files be placed?",
      initial: "lib",
    },
  ]);

  if (!response.framework) {
    console.log(pc.yellow("  Aborted."));
    return;
  }

  const config: SinewConfig = {
    framework: response.framework,
    paths: {
      lib: response.libPath,
    },
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(pc.green(`\n  Created ${CONFIG_FILE}`));
  console.log(pc.dim(`\n  Run ${pc.bold("sinew add <pattern>")} to add a pattern.\n`));
}

function detectFramework(): Framework | null {
  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    if (deps.next) return "nextjs";
    if (deps["@remix-run/react"]) return "remix";
    if (deps["@sveltejs/kit"]) return "sveltekit";
    if (deps.nuxt) return "nuxt";
  } catch {
    // Ignore errors
  }

  return null;
}
