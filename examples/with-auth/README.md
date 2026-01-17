# Next.js + Auth Starter

A minimal Next.js 16 starter with NextAuth.js v5.

## Quick Start

```bash
# Clone this example
npx degit greatnessinabox/sinew/examples/with-auth my-app
cd my-app

# Install dependencies
bun install  # or npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your OAuth credentials

# Start dev server
bun run dev
```

## What's Included

- ✅ Next.js 16 with App Router
- ✅ NextAuth.js v5 with GitHub OAuth
- ✅ TypeScript
- ✅ Protected routes with middleware

## Project Structure

```
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # Auth handlers
│   ├── dashboard/page.tsx               # Protected page
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── auth.ts                          # Auth config
├── middleware.ts                        # Route protection
└── .env.example                         # Environment template
```

## Getting OAuth Credentials

### GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL to `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env.local`

## Learn More

- [NextAuth.js Docs](https://authjs.dev)
- [Sinew Auth Patterns](https://sinew.dev/patterns/auth)
