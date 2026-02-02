---
"@greatnessinabox/sinew": minor
"@sinew/registry": minor
---

feat(registry): add 20 new patterns across 4 categories

New categories and patterns:

**AI & LLM:**

- ai-chat: Streaming chat with Vercel AI SDK and provider abstraction
- ai-embeddings: Vector embeddings for RAG with Upstash Vector
- ai-tool-calling: Function/tool calling with Zod schema validation
- ai-rate-limits: Token-aware rate limiting and cost tracking
- ai-streaming-ui: React components for streaming AI responses

**Infrastructure:**

- file-uploads: Presigned URL uploads with S3 and Vercel Blob
- background-jobs: Serverless job queues with Inngest
- scheduled-tasks: Cron jobs with Inngest and Vercel cron
- webhooks: Webhook receiving with HMAC signature verification
- realtime: Pub/sub real-time updates with Pusher

**Developer Experience:**

- feature-flags: Feature toggles with gradual rollouts and targeting
- analytics: Privacy-friendly analytics with PostHog
- search: Full-text search with Meilisearch
- i18n: Internationalization with next-intl
- content-moderation: Text/image moderation with OpenAI

**Security & Compliance:**

- audit-logging: Immutable audit trail for compliance
- data-encryption: Field-level encryption for PII
- csrf-protection: CSRF token handling for mutations
- cors-config: Proper CORS setup for API routes
- mfa: Multi-factor auth with TOTP

Also includes:

- Interactive playground demo for feature-flags pattern
- Full MDX documentation for all 20 patterns
