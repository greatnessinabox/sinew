import Anthropic from "@anthropic-ai/sdk";
import { execFileSync } from "node:child_process";

const MARKER_START = "<!-- ai-pr-description:start -->";
const MARKER_END = "<!-- ai-pr-description:end -->";

// Opus 4.7 has a 1M context window, but cap the diff so a single huge PR can't
// blow past it or run up the bill. ~400K chars is roughly 100K tokens.
const MAX_DIFF_CHARS = 400_000;

const SYSTEM_PROMPT = `You write accurate pull request descriptions for an open-source TypeScript monorepo (sinew: infrastructure patterns CLI + registry + docs site).

You are given the PR title, commit subjects, and the full diff. Write a description in GitHub-flavored Markdown with exactly these sections:

## Summary
One or two sentences on what the PR does and why, grounded in the diff.

## Changes
A bullet list of the concrete, notable changes. Reference real file paths and symbols from the diff. Group related changes. Skip lockfile churn and generated files.

## Testing
What a reviewer should run or check, based on what changed (e.g. specific commands, affected packages). If nothing is verifiable, say so plainly.

Rules:
- Describe only what the diff actually shows. Never invent changes, tickets, or motivations.
- Be concise and direct. Short sentences. No filler, no marketing language.
- Do not use dashes for parenthetical breaks.
- Do not wrap the output in a code fence. Output only the Markdown body, no preamble.`;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getString(obj: unknown, key: string): string | undefined {
  if (typeof obj === "object" && obj !== null && key in obj) {
    const value: unknown = Reflect.get(obj, key);
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

function gitText(args: string[]): string {
  return execFileSync("git", args, {
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function collectDiff(baseSha: string, headSha: string): { diff: string; truncated: boolean } {
  const raw = gitText(["diff", `${baseSha}...${headSha}`]);
  if (raw.length > MAX_DIFF_CHARS) {
    return { diff: raw.slice(0, MAX_DIFF_CHARS), truncated: true };
  }
  return { diff: raw, truncated: false };
}

function collectCommits(baseSha: string, headSha: string): string {
  return gitText(["log", "--no-merges", "--format=- %s", `${baseSha}..${headSha}`]).trim();
}

async function generateDescription(input: {
  title: string;
  commits: string;
  diff: string;
  truncated: boolean;
}): Promise<string> {
  const client = new Anthropic();
  const truncationNote = input.truncated
    ? "\n\n(The diff was truncated because it is very large; summarize from what is shown.)"
    : "";

  const userContent = [
    `PR title: ${input.title}`,
    "",
    `Commits:\n${input.commits || "(none)"}`,
    "",
    `Diff:\n${input.diff}${truncationNote}`,
  ].join("\n");

  const stream = client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    // The system prompt is stable across PRs, so cache it. The diff varies and
    // sits after the cached prefix, so it is never cached (expected).
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userContent }],
  });

  const message = await stream.finalMessage();
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function mergeIntoBody(currentBody: string, aiBlock: string): string {
  const block = `${MARKER_START}\n${aiBlock}\n${MARKER_END}`;
  const startIndex = currentBody.indexOf(MARKER_START);
  const endIndex = currentBody.indexOf(MARKER_END);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const before = currentBody.slice(0, startIndex);
    const after = currentBody.slice(endIndex + MARKER_END.length);
    return `${before}${block}${after}`;
  }

  const existing = currentBody.trim();
  return existing.length > 0 ? `${existing}\n\n${block}\n` : `${block}\n`;
}

async function githubRequest(
  repo: string,
  prNumber: string,
  token: string,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumber}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "ai-pr-description",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }
  return response;
}

async function main(): Promise<void> {
  const token = requireEnv("GITHUB_TOKEN");
  const repo = requireEnv("GITHUB_REPOSITORY");
  const prNumber = requireEnv("PR_NUMBER");
  const baseSha = requireEnv("BASE_SHA");
  const headSha = requireEnv("HEAD_SHA");
  const title = process.env.PR_TITLE ?? "";
  // Anthropic() reads ANTHROPIC_API_KEY; fail early with a clear message if absent.
  requireEnv("ANTHROPIC_API_KEY");

  const { diff, truncated } = collectDiff(baseSha, headSha);
  if (diff.trim().length === 0) {
    console.log("No diff between base and head; skipping description.");
    return;
  }

  const commits = collectCommits(baseSha, headSha);
  const aiBlock = await generateDescription({ title, commits, diff, truncated });
  if (aiBlock.length === 0) {
    console.log("Model returned no description; leaving PR body unchanged.");
    return;
  }

  const current = await githubRequest(repo, prNumber, token);
  const currentBody = getString(await current.json(), "body") ?? "";
  const nextBody = mergeIntoBody(currentBody, aiBlock);

  if (nextBody === currentBody) {
    console.log("PR body already up to date.");
    return;
  }

  await githubRequest(repo, prNumber, token, {
    method: "PATCH",
    body: JSON.stringify({ body: nextBody }),
  });
  console.log(`Updated PR #${prNumber} description.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
