# Next.js + Prisma Starter

A minimal Next.js 16 starter with Prisma ORM.

## Quick Start

```bash
# Clone this example
npx degit greatnessinabox/sinew/examples/with-prisma my-app
cd my-app

# Install dependencies
bun install  # or npm install

# Set up database
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# Push schema to database
bun run db:push

# Start dev server
bun run dev
```

## What's Included

- ✅ Next.js 16 with App Router
- ✅ Prisma ORM with PostgreSQL
- ✅ TypeScript
- ✅ Example User model and API route

## Project Structure

```
├── app/
│   ├── api/users/route.ts    # Example API route
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── db.ts                 # Prisma client singleton
├── prisma/
│   └── schema.prisma         # Database schema
└── .env.example              # Environment template
```

## Learn More

- [Prisma Docs](https://www.prisma.io/docs)
- [Sinew Database Patterns](https://sinew.dev/patterns/database)
