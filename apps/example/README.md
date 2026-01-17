# Sinew Example App

A **kitchen sink** example app demonstrating multiple Sinew patterns working together. This serves as both a reference implementation and an integration test suite.

## Patterns Demonstrated

| Pattern            | Implementation                     |
| ------------------ | ---------------------------------- |
| **Database**       | Prisma with PostgreSQL             |
| **Authentication** | NextAuth.js v5 with OAuth          |
| **Authorization**  | Role-based access control (RBAC)   |
| **Environment**    | Type-safe env with @t3-oss/env     |
| **API Validation** | Zod schemas for request/response   |
| **Testing**        | Playwright E2E + Vitest unit tests |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL (or use Docker)
- GitHub/Google OAuth credentials (optional)

### Setup

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Set up environment:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Start database (with Docker):**

   ```bash
   docker run --name sinew-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=sinew_example -p 5432:5432 -d postgres:16-alpine
   ```

4. **Set up database:**

   ```bash
   bun run db:push
   bun run db:seed
   ```

5. **Start dev server:**

   ```bash
   bun run dev
   ```

   Open [http://localhost:3001](http://localhost:3001)

## Testing

### E2E Tests (Playwright)

```bash
# Run all E2E tests
bun run test:e2e

# Run with UI
bun run test:e2e:ui

# Run specific test file
bunx playwright test e2e/home.spec.ts
```

### Unit Tests (Vitest)

```bash
bun run test
```

## Project Structure

```
apps/example/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # Auth handlers
│   │   ├── posts/               # Posts CRUD API
│   │   └── health/              # Health check endpoint
│   ├── dashboard/               # Protected dashboard
│   ├── login/                   # OAuth login page
│   └── page.tsx                 # Public homepage
├── lib/
│   ├── auth.ts                  # NextAuth configuration
│   └── db.ts                    # Prisma client
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Seed data
├── e2e/                         # Playwright tests
│   ├── home.spec.ts
│   ├── api.spec.ts
│   └── auth.spec.ts
├── env.ts                       # Type-safe environment
└── middleware.ts                # Auth middleware
```

## API Endpoints

| Method | Endpoint      | Description          | Auth |
| ------ | ------------- | -------------------- | ---- |
| GET    | `/api/health` | Health check         | No   |
| GET    | `/api/posts`  | List published posts | No   |
| POST   | `/api/posts`  | Create a post        | Yes  |

## Environment Variables

| Variable              | Description                       | Required |
| --------------------- | --------------------------------- | -------- |
| `DATABASE_URL`        | PostgreSQL connection string      | Yes      |
| `AUTH_SECRET`         | NextAuth.js secret (min 32 chars) | Yes      |
| `AUTH_GITHUB_ID`      | GitHub OAuth client ID            | No       |
| `AUTH_GITHUB_SECRET`  | GitHub OAuth client secret        | No       |
| `AUTH_GOOGLE_ID`      | Google OAuth client ID            | No       |
| `AUTH_GOOGLE_SECRET`  | Google OAuth client secret        | No       |
| `NEXT_PUBLIC_APP_URL` | Public app URL                    | No       |
