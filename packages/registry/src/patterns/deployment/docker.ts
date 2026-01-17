import type { Pattern } from "../../schema.js";

export const docker: Pattern = {
  name: "Docker Config",
  slug: "docker",
  description:
    "Multi-stage Docker builds optimized for Next.js. Produces images under 200MB with proper caching and security.",
  category: "deployment",
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "Dockerfile",
        content: `# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

ARG DATABASE_URL
ARG NEXT_PUBLIC_APP_URL

ENV DATABASE_URL=\${DATABASE_URL}
ENV NEXT_PUBLIC_APP_URL=\${NEXT_PUBLIC_APP_URL}

RUN npm run build

# ---- Production ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
`,
      },
      {
        path: "docker-compose.yml",
        content: `services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
        - NEXT_PUBLIC_APP_URL=http://localhost:3000
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
      - AUTH_SECRET=\${AUTH_SECRET}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
`,
      },
      {
        path: "docker-compose.dev.yml",
        content: `# Use with: docker compose -f docker-compose.yml -f docker-compose.dev.yml up

services:
  app:
    build:
      target: deps
    command: npm run dev
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
`,
      },
      {
        path: ".dockerignore",
        content: `# Dependencies
node_modules
.pnp
.pnp.js

# Build outputs
.next
out
build
dist

# Testing
coverage

# Git
.git
.gitignore

# IDE
.vscode
.idea
*.swp
*.swo

# Environment (never include secrets!)
.env
.env.*
!.env.example

# Misc
README.md
*.md
.DS_Store
Thumbs.db
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
