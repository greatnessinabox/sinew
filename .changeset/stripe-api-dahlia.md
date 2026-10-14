---
"@greatnessinabox/sinew": patch
---

Update the Stripe patterns to Stripe SDK v22 and pin the API version to `2026-08-26.dahlia`. The `stripe-payments` and `usage-billing` patterns now generate `lib/stripe.ts` with the new `apiVersion` literal, which the v22 types require. Run `sinew update stripe-payments` to pull it; files you've changed are staged as `.new` beside your copy.
