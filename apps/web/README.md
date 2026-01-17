# Sinew Web

Documentation website for Sinew patterns.

## Tech Stack

- **Next.js 16** with App Router
- **React 19**
- **TypeScript 5.9**
- **Tailwind CSS 4**
- **Shiki** for syntax highlighting
- **MDX** for pattern documentation

## Development

```bash
# From repo root
bun run dev

# Or from this directory
bun run dev
```

Runs at [http://localhost:3000](http://localhost:3000)

## Structure

```
app/
├── components/       # Reusable UI components
├── lib/              # Utilities and pattern definitions
├── patterns/         # Pattern pages ([category]/[slug])
├── page.tsx          # Homepage
└── layout.tsx        # Root layout

content/
└── patterns/         # MDX pattern documentation
    ├── database/
    ├── auth/
    └── ...
```

## Deployment

Deployed to Vercel. See `vercel.json` for configuration.

```bash
# Build for production
bun run build

# Start production server
bun run start
```
