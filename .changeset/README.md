# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets).

## Adding a changeset

When you make a change that should be released, run:

```bash
bun changeset
```

This will prompt you to:

1. Select the packages that changed
2. Choose the semver bump (major, minor, patch)
3. Write a summary of the change

The changeset will be committed with your PR and consumed during the next release.

## Release process

Releases are automated via GitHub Actions. When changesets are merged to `main`:

1. A "Version Packages" PR is created/updated
2. Merging that PR publishes to npm and creates GitHub releases
