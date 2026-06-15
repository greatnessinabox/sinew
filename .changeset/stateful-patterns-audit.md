---
"@greatnessinabox/sinew": minor
---

Track installed patterns in a `sinew.lock` manifest and add `sinew audit`. `add` now records each copied pattern (framework, CLI version, content hash); `audit` compares those against the current registry and flags patterns that changed upstream since you copied them, or were removed. Stateful copy-paste: own the code, but know when it drifts from upstream.
