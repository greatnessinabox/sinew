import { test, expect } from "bun:test";
import { patterns } from "@sinew/registry";
import { hashPattern, auditManifest, recordPattern, type Manifest } from "./src/manifest";

const [p0, p1] = patterns;
if (!p0 || !p1) throw new Error("registry must have at least two patterns");
const fw0 = p0.frameworks[0];
const fw1 = p1.frameworks[0];
if (!fw0 || !fw1) throw new Error("patterns must declare a framework");

test("hashPattern is deterministic and well-formed", () => {
  expect(hashPattern(p0, fw0)).toBe(hashPattern(p0, fw0));
  expect(hashPattern(p0, fw0)).toMatch(/^sha256:[0-9a-f]{64}$/);
});

test("auditManifest classifies current, outdated, and removed", () => {
  let m: Manifest = { version: 1, patterns: {} };
  const k0 = `${p0.category}/${p0.slug}`;
  const k1 = `${p1.category}/${p1.slug}`;

  m = recordPattern(m, k0, {
    framework: fw0,
    cliVersion: "1.0.0",
    hash: hashPattern(p0, fw0),
    addedAt: "t",
  });
  m = recordPattern(m, k1, {
    framework: fw1,
    cliVersion: "1.0.0",
    hash: "sha256:wrong",
    addedAt: "t",
  });
  m = recordPattern(m, "ghost/missing", {
    framework: fw0,
    cliVersion: "1.0.0",
    hash: "x",
    addedAt: "t",
  });

  const status = Object.fromEntries(auditManifest(m).map((r) => [r.key, r.status]));
  expect(status[k0]).toBe("current");
  expect(status[k1]).toBe("outdated");
  expect(status["ghost/missing"]).toBe("removed");
});
