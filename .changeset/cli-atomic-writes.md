---
"@greatnessinabox/sinew": patch
---

Write files atomically in `sinew init` and `sinew add`. They now use the `wx` open flag and prompt to overwrite only on an actual conflict, instead of an `existsSync` check followed by a separate write. This removes a file-system race flagged by CodeQL.
