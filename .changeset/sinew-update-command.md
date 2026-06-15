---
"@greatnessinabox/sinew": minor
---

Add `sinew update [pattern]`: pull the current registry version of outdated patterns. New files are written in place; files you've changed are staged as `.new` beside your copy to review and merge, so your edits are never clobbered. A pattern is marked current in `sinew.lock` once it has no pending `.new` files.
