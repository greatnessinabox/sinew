# SaaS Starter

A production-ready SaaS starter combining multiple Sinew patterns.

## Quick Start

```bash
# Clone this example
npx degit greatnessinabox/sinew/examples/saas-starter my-saas
cd my-saas

# Install dependencies
bun install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up database
bun run db:push
bun run db:seed

# Start dev server
bun run dev
```

## What's Included

| Feature            | Implementation                    |
| ------------------ | --------------------------------- |
| **Database**       | Prisma + PostgreSQL               |
| **Authentication** | NextAuth.js v5 with GitHub/Google |
| **Payments**       | Stripe subscriptions              |
| **Email**          | Resend for transactional emails   |
| **Environment**    | Type-safe env with Zod validation |
| **Styling**        | Tailwind CSS v4                   |

## Project Structure

```
├── app/
│   ├── (auth)/              # Auth pages (login, register)
│   ├── (dashboard)/         # Protected dashboard
│   ├── (marketing)/         # Public pages
│   ├── api/
│   │   ├── auth/            # Auth endpoints
│   │   ├── webhooks/        # Stripe webhooks
│   │   └── ...
│   └── layout.tsx
├── lib/
│   ├── auth.ts              # Auth config
│   ├── db.ts                # Prisma client
│   ├── email.ts             # Resend client
│   └── stripe.ts            # Stripe client
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data
└── env.ts                   # Type-safe env
```

## Environment Variables

| Variable                | Description                  |
| ----------------------- | ---------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string |
| `AUTH_SECRET`           | NextAuth secret (32+ chars)  |
| `AUTH_GITHUB_ID`        | GitHub OAuth client ID       |
| `AUTH_GITHUB_SECRET`    | GitHub OAuth client secret   |
| `STRIPE_SECRET_KEY`     | Stripe secret key            |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret        |
| `RESEND_API_KEY`        | Resend API key               |

## Setting Up Stripe

1. Create products in Stripe Dashboard
2. Copy price IDs to your config
3. Run `bun run stripe:listen` for local webhooks
4. Test with Stripe test cards

## Learn More

- [Sinew Patterns](https://sinew.marquis.codes/patterns)
- [Stripe Docs](https://stripe.com/docs)
- [Resend Docs](https://resend.com/docs)
