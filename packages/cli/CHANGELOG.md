# @greatnessinabox/sinew

## 1.0.3

### Patch Changes

- 0a5ae89: Write files atomically in `sinew init` and `sinew add`. They now use the `wx` open flag and prompt to overwrite only on an actual conflict, instead of an `existsSync` check followed by a separate write. This removes a file-system race flagged by CodeQL.

## 1.0.2

### Patch Changes

- Fix path handling in `sinew add` command to correctly place root-level files (Dockerfile, vercel.json, app/, e2e/, etc.) at project root instead of lib directory. Also fixes issue where files with `lib/` prefix were being duplicated (e.g., `lib/lib/db.ts`).
