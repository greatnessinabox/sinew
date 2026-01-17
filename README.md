# sinew

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

**30 production-ready patterns across 10 categories**

### Database

| Pattern                                                     | Description                                          |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| [Connection Pooling](/patterns/database/connection-pooling) | Serverless-ready Prisma setup with singleton pattern |
| [Prisma Edge](/patterns/database/prisma-edge)               | Configure Prisma for edge runtime with Accelerate    |
| [Drizzle Config](/patterns/database/drizzle-config)         | Type-safe Drizzle ORM setup with migrations          |

### Authentication

| Pattern                                       | Description                                      |
| --------------------------------------------- | ------------------------------------------------ |
| [OAuth Setup](/patterns/auth/oauth-setup)     | Auth.js with GitHub/Google and database sessions |
| [Session Management](/patterns/auth/sessions) | Secure session handling with database storage    |
| [RBAC Patterns](/patterns/auth/rbac)          | Role-based access control implementation         |

### API

| Pattern                                        | Description                                          |
| ---------------------------------------------- | ---------------------------------------------------- |
| [Rate Limiting](/patterns/api/rate-limiting)   | Sliding window rate limiting with in-memory or Redis |
| [Validation](/patterns/api/validation)         | Type-safe request/response validation with Zod       |
| [Error Handling](/patterns/api/error-handling) | Custom error classes and structured responses        |

### Caching

| Pattern                                              | Description                                           |
| ---------------------------------------------------- | ----------------------------------------------------- |
| [In-Memory Cache](/patterns/caching/in-memory-cache) | LRU cache for serverless with zero dependencies       |
| [Next.js Cache](/patterns/caching/nextjs-cache)      | Built-in caching with unstable_cache and revalidation |
| [Redis Cache](/patterns/caching/redis-cache)         | Redis caching with Upstash and cache invalidation     |

### Testing

| Pattern                                                  | Description                                        |
| -------------------------------------------------------- | -------------------------------------------------- |
| [Vitest Setup](/patterns/testing/vitest-setup)           | Unit and integration testing configuration         |
| [Playwright E2E](/patterns/testing/playwright-e2e)       | End-to-end testing with page objects and CI config |
| [Component Testing](/patterns/testing/component-testing) | React component testing with Testing Library       |
| [MSW Mocking](/patterns/testing/msw-mocking)             | API mocking with Mock Service Worker               |

### Email

| Pattern                                  | Description                                    |
| ---------------------------------------- | ---------------------------------------------- |
| [Resend](/patterns/email/resend-email)   | Transactional email with React Email templates |
| [Nodemailer](/patterns/email/nodemailer) | Free email sending with SMTP providers         |
| [AWS SES](/patterns/email/aws-ses)       | Cost-effective email at scale                  |

### Payments

| Pattern                                           | Description                                    |
| ------------------------------------------------- | ---------------------------------------------- |
| [Stripe](/patterns/payments/stripe-payments)      | Checkout sessions, webhooks, and subscriptions |
| [LemonSqueezy](/patterns/payments/lemonsqueezy)   | Payments with built-in tax handling            |
| [Usage Billing](/patterns/payments/usage-billing) | Metered billing with Stripe                    |

### Monitoring

| Pattern                                             | Description                                          |
| --------------------------------------------------- | ---------------------------------------------------- |
| [Sentry](/patterns/monitoring/sentry-monitoring)    | Error tracking and performance monitoring            |
| [Logging](/patterns/monitoring/logging)             | Structured JSON logging with Pino                    |
| [OpenTelemetry](/patterns/monitoring/opentelemetry) | Open standard observability with tracing and metrics |

### Environment

| Pattern                                              | Description                                      |
| ---------------------------------------------------- | ------------------------------------------------ |
| [Type-safe Env](/patterns/environment/type-safe-env) | Runtime-validated environment variables with Zod |
| [Secrets Management](/patterns/environment/secrets)  | Secure secrets handling with encryption at rest  |

### Deployment

| Pattern                                               | Description                                             |
| ----------------------------------------------------- | ------------------------------------------------------- |
| [Docker](/patterns/deployment/docker)                 | Multi-stage Docker builds for Next.js                   |
| [GitHub Actions](/patterns/deployment/github-actions) | CI/CD pipelines for testing and deploying               |
| [Vercel](/patterns/deployment/vercel)                 | Vercel deployment with edge functions and optimizations |

## Interactive Demos

Try patterns live at [sinew.marquis.codes/demo](https://sinew.marquis.codes/demo):

- **In-Memory Cache** — Watch LRU eviction in action
- **API Validation** — See Zod validation errors in real-time
- **Rate Limiting** — Experience request throttling firsthand
- **Error Handling** — Trigger different error types and see responses
- **Logging** — See structured logs stream with automatic redaction
- **Sessions** — Create, revoke, and manage user sessions

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
