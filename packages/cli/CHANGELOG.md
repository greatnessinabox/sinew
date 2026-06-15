# @greatnessinabox/sinew

## 1.3.0

### Minor Changes

- 4521c8e: Add `sinew update [pattern]`: pull the current registry version of outdated patterns. New files are written in place; files you've changed are staged as `.new` beside your copy to review and merge, so your edits are never clobbered. A pattern is marked current in `sinew.lock` once it has no pending `.new` files.

## 1.2.0

### Minor Changes

- 20af2f8: Track installed patterns in a `sinew.lock` manifest and add `sinew audit`. `add` now records each copied pattern (framework, CLI version, content hash); `audit` compares those against the current registry and flags patterns that changed upstream since you copied them, or were removed. Stateful copy-paste: own the code, but know when it drifts from upstream.

## 1.1.0

### Minor Changes

- 20aa023: Add 20 new patterns across four categories: AI & LLM (chat, embeddings, tool calling, rate limits, streaming UI), Infrastructure (file uploads, background jobs, scheduled tasks, webhooks, realtime), Security (audit logging, encryption, CSRF, CORS, MFA), and Developer Experience (feature flags, analytics, search, i18n, content moderation).

### Patch Changes

- Updated dependencies [20aa023]
  - @sinew/registry@1.1.0

## 1.0.3

### Patch Changes

- 0a5ae89: Write files atomically in `sinew init` and `sinew add`. They now use the `wx` open flag and prompt to overwrite only on an actual conflict, instead of an `existsSync` check followed by a separate write. This removes a file-system race flagged by CodeQL.

## 1.0.2

### Patch Changes

- Fix path handling in `sinew add` command to correctly place root-level files (Dockerfile, vercel.json, app/, e2e/, etc.) at project root instead of lib directory. Also fixes issue where files with `lib/` prefix were being duplicated (e.g., `lib/lib/db.ts`).
