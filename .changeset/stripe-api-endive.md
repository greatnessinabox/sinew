---
"@greatnessinabox/sinew": patch
---

Update the Stripe patterns to Stripe SDK v23 and pin the API version to `2026-09-30.endive`. The `stripe-payments` and `usage-billing` patterns now generate `lib/stripe.ts` with the new `apiVersion` literal, which the v23 types require. Run `sinew update stripe-payments` to pull it; files you've changed are staged as `.new` beside your copy.
