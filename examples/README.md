# Sinew Examples

Standalone starter templates demonstrating Sinew patterns in action.

## Available Examples

| Example                          | Description                | Patterns                        |
| -------------------------------- | -------------------------- | ------------------------------- |
| [`with-prisma`](./with-prisma)   | Minimal Prisma setup       | Database                        |
| [`with-auth`](./with-auth)       | NextAuth.js authentication | Auth, Sessions                  |
| [`saas-starter`](./saas-starter) | Full SaaS template         | Auth, Database, Payments, Email |

## Usage

Clone any example using `degit`:

```bash
# Prisma example
npx degit greatnessinabox/sinew/examples/with-prisma my-app

# Auth example
npx degit greatnessinabox/sinew/examples/with-auth my-app

# Full SaaS starter
npx degit greatnessinabox/sinew/examples/saas-starter my-saas
```

Then follow the README in each example for setup instructions.

## Contributing

Want to add an example? Each example should:

1. Be self-contained (no workspace dependencies)
2. Include a detailed README with setup instructions
3. Demonstrate one or more Sinew patterns
4. Be minimal — only include what's necessary

Submit a PR with your example in the `examples/` directory.
