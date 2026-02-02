# sinew

[![CI](https://github.com/greatnessinabox/sinew/actions/workflows/ci.yml/badge.svg)](https://github.com/greatnessinabox/sinew/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@greatnessinabox/sinew.svg)](https://www.npmjs.com/package/@greatnessinabox/sinew)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

**Production-ready infrastructure patterns you can copy and paste into your apps.**

Sinew gives you battle-tested infrastructure code—database connections, authentication, deployment configs—that you own and can customize. No dependencies, no lock-in. Just copy what you need.

## Why Sinew?

Every project needs the same infrastructure pieces: database connections that don't leak, auth that actually works, Docker configs that aren't 2GB. But you end up either:

1. **Copy-pasting from old projects** (carrying forward old mistakes)
2. **Following scattered tutorials** (half outdated, half incomplete)
3. **Installing yet another package** (now you have a dependency to maintain)

Sinew is different. It's a **pattern registry**—curated, tested infrastructure code you copy into your project. You own it. You can read it. You can change it.

## Quick Start

```bash
# Install the CLI
npm install -g sinew

# Initialize in your project
sinew init

# Add a pattern
sinew add database/connection-pooling
```

Or just browse [sinew.marquis.codes](https://sinew.marquis.codes) and copy the code directly.

## Available Patterns

**50+ production-ready patterns across 14 categories**

### Database

| Pattern                                                                                | Description                                          |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [Connection Pooling](https://sinew.marquis.codes/patterns/database/connection-pooling) | Serverless-ready Prisma setup with singleton pattern |
| [Prisma Edge](https://sinew.marquis.codes/patterns/database/prisma-edge)               | Configure Prisma for edge runtime with Accelerate    |
| [Drizzle Config](https://sinew.marquis.codes/patterns/database/drizzle-config)         | Type-safe Drizzle ORM setup with migrations          |

### Authentication

| Pattern                                                                  | Description                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------ |
| [OAuth Setup](https://sinew.marquis.codes/patterns/auth/oauth-setup)     | Auth.js with GitHub/Google and database sessions |
| [Session Management](https://sinew.marquis.codes/patterns/auth/sessions) | Secure session handling with database storage    |
| [RBAC Patterns](https://sinew.marquis.codes/patterns/auth/rbac)          | Role-based access control implementation         |

### API

| Pattern                                                                   | Description                                          |
| ------------------------------------------------------------------------- | ---------------------------------------------------- |
| [Rate Limiting](https://sinew.marquis.codes/patterns/api/rate-limiting)   | Sliding window rate limiting with in-memory or Redis |
| [Validation](https://sinew.marquis.codes/patterns/api/api-validation)     | Type-safe request/response validation with Zod       |
| [Error Handling](https://sinew.marquis.codes/patterns/api/error-handling) | Custom error classes and structured responses        |

### Caching

| Pattern                                                                         | Description                                           |
| ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [In-Memory Cache](https://sinew.marquis.codes/patterns/caching/in-memory-cache) | LRU cache for serverless with zero dependencies       |
| [Next.js Cache](https://sinew.marquis.codes/patterns/caching/nextjs-cache)      | Built-in caching with unstable_cache and revalidation |
| [Redis Cache](https://sinew.marquis.codes/patterns/caching/redis-cache)         | Redis caching with Upstash and cache invalidation     |

### Testing

| Pattern                                                                             | Description                                        |
| ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| [Vitest Setup](https://sinew.marquis.codes/patterns/testing/vitest-setup)           | Unit and integration testing configuration         |
| [Playwright E2E](https://sinew.marquis.codes/patterns/testing/playwright-e2e)       | End-to-end testing with page objects and CI config |
| [Component Testing](https://sinew.marquis.codes/patterns/testing/component-testing) | React component testing with Testing Library       |
| [MSW Mocking](https://sinew.marquis.codes/patterns/testing/msw-mocking)             | API mocking with Mock Service Worker               |

### Email

| Pattern                                                             | Description                                    |
| ------------------------------------------------------------------- | ---------------------------------------------- |
| [Resend](https://sinew.marquis.codes/patterns/email/resend-email)   | Transactional email with React Email templates |
| [Nodemailer](https://sinew.marquis.codes/patterns/email/nodemailer) | Free email sending with SMTP providers         |
| [AWS SES](https://sinew.marquis.codes/patterns/email/aws-ses)       | Cost-effective email at scale                  |

### Payments

| Pattern                                                                      | Description                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------------- |
| [Stripe](https://sinew.marquis.codes/patterns/payments/stripe-payments)      | Checkout sessions, webhooks, and subscriptions |
| [LemonSqueezy](https://sinew.marquis.codes/patterns/payments/lemonsqueezy)   | Payments with built-in tax handling            |
| [Usage Billing](https://sinew.marquis.codes/patterns/payments/usage-billing) | Metered billing with Stripe                    |

### Monitoring

| Pattern                                                                        | Description                                          |
| ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| [Sentry](https://sinew.marquis.codes/patterns/monitoring/sentry-monitoring)    | Error tracking and performance monitoring            |
| [Logging](https://sinew.marquis.codes/patterns/monitoring/logging)             | Structured JSON logging with Pino                    |
| [OpenTelemetry](https://sinew.marquis.codes/patterns/monitoring/opentelemetry) | Open standard observability with tracing and metrics |

### Environment

| Pattern                                                                         | Description                                      |
| ------------------------------------------------------------------------------- | ------------------------------------------------ |
| [Type-safe Env](https://sinew.marquis.codes/patterns/environment/type-safe-env) | Runtime-validated environment variables with Zod |
| [Secrets Management](https://sinew.marquis.codes/patterns/environment/secrets)  | Secure secrets handling with encryption at rest  |

### Deployment

| Pattern                                                                          | Description                                             |
| -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [Docker](https://sinew.marquis.codes/patterns/deployment/docker)                 | Multi-stage Docker builds for Next.js                   |
| [GitHub Actions](https://sinew.marquis.codes/patterns/deployment/github-actions) | CI/CD pipelines for testing and deploying               |
| [Vercel](https://sinew.marquis.codes/patterns/deployment/vercel)                 | Vercel deployment with edge functions and optimizations |

### AI & LLM

| Pattern                                                                    | Description                                   |
| -------------------------------------------------------------------------- | --------------------------------------------- |
| [AI Chat](https://sinew.marquis.codes/patterns/ai/ai-chat)                 | Streaming chat with Vercel AI SDK             |
| [AI Embeddings](https://sinew.marquis.codes/patterns/ai/ai-embeddings)     | Vector embeddings for RAG with Upstash Vector |
| [AI Tool Calling](https://sinew.marquis.codes/patterns/ai/ai-tool-calling) | Function/tool calling with schema validation  |
| [AI Rate Limits](https://sinew.marquis.codes/patterns/ai/ai-rate-limits)   | Token-aware rate limiting and cost tracking   |
| [AI Streaming UI](https://sinew.marquis.codes/patterns/ai/ai-streaming-ui) | React components for streaming AI responses   |

### Infrastructure

| Pattern                                                                                | Description                                   |
| -------------------------------------------------------------------------------------- | --------------------------------------------- |
| [File Uploads](https://sinew.marquis.codes/patterns/infrastructure/file-uploads)       | Presigned URL uploads with S3 and Vercel Blob |
| [Background Jobs](https://sinew.marquis.codes/patterns/infrastructure/background-jobs) | Serverless job queues with Inngest            |
| [Scheduled Tasks](https://sinew.marquis.codes/patterns/infrastructure/scheduled-tasks) | Cron jobs with Inngest and Vercel cron        |
| [Webhooks](https://sinew.marquis.codes/patterns/infrastructure/webhooks)               | Webhook receiving with signature verification |
| [Realtime](https://sinew.marquis.codes/patterns/infrastructure/realtime)               | Pub/sub real-time updates with Pusher         |

### Developer Experience

| Pattern                                                                                            | Description                                      |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [Feature Flags](https://sinew.marquis.codes/patterns/developer-experience/feature-flags)           | Feature toggles with gradual rollouts            |
| [Analytics](https://sinew.marquis.codes/patterns/developer-experience/analytics)                   | Privacy-friendly analytics with PostHog          |
| [Search](https://sinew.marquis.codes/patterns/developer-experience/search)                         | Full-text search with Meilisearch                |
| [i18n](https://sinew.marquis.codes/patterns/developer-experience/i18n)                             | Internationalization with next-intl              |
| [Content Moderation](https://sinew.marquis.codes/patterns/developer-experience/content-moderation) | Text/image moderation for user-generated content |

### Security & Compliance

| Pattern                                                                          | Description                          |
| -------------------------------------------------------------------------------- | ------------------------------------ |
| [Audit Logging](https://sinew.marquis.codes/patterns/security/audit-logging)     | Immutable audit trail for compliance |
| [Data Encryption](https://sinew.marquis.codes/patterns/security/data-encryption) | Field-level encryption for PII       |
| [CSRF Protection](https://sinew.marquis.codes/patterns/security/csrf-protection) | CSRF token handling for mutations    |
| [CORS Config](https://sinew.marquis.codes/patterns/security/cors-config)         | Proper CORS setup for API routes     |
| [MFA](https://sinew.marquis.codes/patterns/security/mfa)                         | Multi-factor auth with TOTP          |

## Interactive Demos

Try patterns live at [sinew.marquis.codes/demo](https://sinew.marquis.codes/demo):

- **In-Memory Cache** — Watch LRU eviction in action
- **API Validation** — See Zod validation errors in real-time
- **Rate Limiting** — Experience request throttling firsthand
- **Error Handling** — Trigger different error types and see responses
- **Logging** — See structured logs stream with automatic redaction
- **Sessions** — Create, revoke, and manage user sessions
- **Feature Flags** — Toggle flags and test gradual rollouts

## CLI Usage

```bash
# Initialize sinew in your project
sinew init

# Add patterns
sinew add database/connection-pooling
sinew add caching/in-memory-cache
sinew add auth/sessions
sinew add api/validation
sinew add monitoring/logging
sinew add deployment/docker

# List all available patterns
sinew list
```

The CLI will:

- Create files in your project (typically in `lib/` or `src/`)
- Show you the dependencies you need to install
- Never overwrite existing files without asking

## Example Apps

Get started quickly with our example templates:

```bash
# Minimal Prisma setup
npx degit greatnessinabox/sinew/examples/with-prisma my-app

# NextAuth.js authentication
npx degit greatnessinabox/sinew/examples/with-auth my-app

# Full SaaS starter (Auth + Payments + Email)
npx degit greatnessinabox/sinew/examples/saas-starter my-saas
```

See the [examples directory](./examples) for more details.

## Project Structure

```text
sinew/
├── apps/
│   ├── web/              # Documentation site (Next.js)
│   └── example/          # Kitchen sink demo with E2E tests
├── examples/             # Standalone starter templates
│   ├── with-prisma/      # Minimal Prisma example
│   ├── with-auth/        # NextAuth.js example
│   └── saas-starter/     # Full SaaS template
├── packages/
│   ├── cli/              # sinew CLI
│   ├── registry/         # Pattern definitions
│   └── ...
└── README.md
```

## Development

This is a [Turborepo](https://turbo.build) monorepo using [Bun](https://bun.sh).

### Prerequisites

- **Node.js 20+** (use `.nvmrc` with `nvm use`)
- **Bun 1.3+** as package manager

### Tech Stack

| Technology   | Version |
| ------------ | ------- |
| Node.js      | 20      |
| Next.js      | 16      |
| React        | 19      |
| TypeScript   | 5.9     |
| Tailwind CSS | 4       |
| Bun          | 1.3     |

### Getting Started

```bash
# Use correct Node version
nvm use

# Install dependencies
bun install

# Run development servers
bun run dev

# Build everything
bun run build

# Run linting
bun run lint

# Type check
bun run check-types

# Run example app
bun run dev:example

# Run E2E tests (on example app)
bun run test:e2e
```

- Web app runs at [http://localhost:3000](http://localhost:3000)
- Example app runs at [http://localhost:3001](http://localhost:3001)

## Philosophy

1. **You own the code.** Patterns are copied into your project, not installed as dependencies.
2. **Readable over clever.** Code should be obvious. No magic.
3. **Production-first.** Every pattern is what we'd ship to production.
4. **Framework-aware.** Patterns are adapted for Next.js, Remix, SvelteKit, etc.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Adding a new pattern:**

1. Create the pattern in `packages/registry/src/patterns/`
2. Add a documentation page in `apps/web/app/patterns/`
3. Update the pattern list in `packages/registry/src/index.ts`
4. Submit a PR

## License

MIT License. See [LICENSE](LICENSE) for details.

## Links

- **Website:** [sinew.marquis.codes](https://sinew.marquis.codes)
- **GitHub:** [github.com/greatnessinabox/sinew](https://github.com/greatnessinabox/sinew)
- **Author:** [marquis.codes](https://marquis.codes)

---

Built by [marquis.codes](https://marquis.codes)
