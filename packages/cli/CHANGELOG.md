# @greatnessinabox/sinew

## 1.0.2

### Patch Changes

- Fix path handling in `sinew add` command to correctly place root-level files (Dockerfile, vercel.json, app/, e2e/, etc.) at project root instead of lib directory. Also fixes issue where files with `lib/` prefix were being duplicated (e.g., `lib/lib/db.ts`).
