import { test, expect } from "bun:test";
import { relativeTargetPath } from "./src/project";

test("relativeTargetPath maps registry paths to project destinations", () => {
  // lib/ prefix is rewritten to the configured lib path
  expect(relativeTargetPath("lib/db.ts", "app/lib")).toBe("app/lib/db.ts");
  // dotfiles, root files, and framework dirs stay at the root
  expect(relativeTargetPath(".env.example", "lib")).toBe(".env.example");
  expect(relativeTargetPath("Dockerfile", "lib")).toBe("Dockerfile");
  expect(relativeTargetPath("app/api/route.ts", "lib")).toBe("app/api/route.ts");
  expect(relativeTargetPath("vitest.config.ts", "lib")).toBe("vitest.config.ts");
  // everything else lands under the lib path
  expect(relativeTargetPath("auth/session.ts", "lib")).toBe("lib/auth/session.ts");
});
