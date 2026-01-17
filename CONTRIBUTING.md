# Contributing to Sinew

Thanks for your interest in contributing to Sinew! This project aims to make infrastructure patterns accessible to all developers.

## Ways to Contribute

### 1. Submit a Pattern

The best way to contribute is by adding new patterns. Patterns should be:

- **Production-tested**: Code that you've actually used in real projects
- **Well-documented**: Clear explanations of the problem and solution
- **Framework-aware**: Note which frameworks the pattern supports

#### Pattern Structure

Patterns live in `packages/registry/src/patterns/`. Each pattern includes:

```typescript
export const myPattern: Pattern = {
  name: "My Pattern",
  slug: "my-pattern",
  description: "Short description of what this solves",
  category: "database" | "auth" | "environment" | "deployment",
  frameworks: ["nextjs", "remix", ...],
  files: {
    nextjs: [
      {
        path: "lib/my-file.ts",
        content: `// Your code here`,
      },
    ],
  },
  dependencies: {
    nextjs: [
      { name: "some-package", version: "^1.0.0", dev: false },
    ],
  },
};
```

### 2. Improve Documentation

- Fix typos or unclear explanations
- Add gotchas you've discovered
- Improve code comments

### 3. Report Issues

Found a bug or have a suggestion? [Open an issue](https://github.com/greatnessinabox/sinew/issues).

### 4. Spread the Word

- Star the repo
- Share with other developers
- Write about patterns you find useful

## Development Setup

### Prerequisites

- **Node.js 20+** - Use `nvm use` to pick up the `.nvmrc`
- **Bun 1.3+** - Install from [bun.sh](https://bun.sh)

### Setup

```bash
# Clone the repo
git clone https://github.com/greatnessinabox/sinew.git
cd sinew

# Use correct Node version
nvm use

# Install dependencies
bun install

# Start development server
bun run dev

# Run linting
bun run lint

# Type check
bun run check-types

# Build all packages
bun run build
```

## Project Structure

```
sinew/
├── apps/
│   └── web/          # Next.js documentation site
├── packages/
│   ├── cli/          # CLI tool (sinew add, sinew init)
│   └── registry/     # Pattern definitions
└── ...
```

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b my-new-pattern`
3. Make your changes
4. Run `bun lint` and `bun run build` to ensure everything works
5. Commit with a clear message: `git commit -m "Add OAuth pattern for Next.js"`
6. Push to your fork: `git push origin my-new-pattern`
7. Open a Pull Request

## Code Style

- Use TypeScript
- Follow existing patterns in the codebase
- Keep things simple - avoid over-engineering
- Comment the "why", not the "what"
- Run `bun run format` before committing

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/). Commits are validated by commitlint.

### Format

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type       | Description                             |
| ---------- | --------------------------------------- |
| `feat`     | New feature                             |
| `fix`      | Bug fix                                 |
| `docs`     | Documentation                           |
| `style`    | Formatting (no code change)             |
| `refactor` | Code change that neither fixes nor adds |
| `perf`     | Performance improvement                 |
| `test`     | Adding tests                            |
| `build`    | Build system or dependencies            |
| `ci`       | CI configuration                        |
| `chore`    | Maintenance                             |

### Scopes

| Scope      | Description         |
| ---------- | ------------------- |
| `web`      | apps/web            |
| `cli`      | packages/cli        |
| `registry` | packages/registry   |
| `ui`       | packages/ui         |
| `config`   | Configuration files |
| `deps`     | Dependencies        |

### Examples

```bash
feat(cli): add pattern search command
fix(web): resolve code block overflow
docs(registry): add pattern documentation
chore(deps): update dependencies
```

## Releases

Releases are managed with [Changesets](https://github.com/changesets/changesets).

### Adding a changeset

When you make a change that should be released:

```bash
bun changeset
```

Follow the prompts to describe your change. Commit the generated changeset file with your PR.

### Release process

1. Changesets accumulate in `.changeset/`
2. When merged to `main`, a "Version Packages" PR is created
3. Merging that PR publishes to npm and creates GitHub releases

## Pattern Guidelines

When creating patterns, prioritize:

1. **Clarity over cleverness** - Code should be readable
2. **Practical defaults** - Work out of the box for common cases
3. **Escape hatches** - Easy to customize when needed
4. **Security** - Follow best practices, no secrets in code

## Questions?

- Open a [discussion](https://github.com/greatnessinabox/sinew/discussions)
- Reach out on [Bluesky](https://bsky.app/profile/greatnessinabox.bsky.social)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
