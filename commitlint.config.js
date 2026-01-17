export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation
        "style", // Formatting, no code change
        "refactor", // Code change that neither fixes a bug nor adds a feature
        "perf", // Performance improvement
        "test", // Adding tests
        "build", // Build system or dependencies
        "ci", // CI configuration
        "chore", // Maintenance
        "revert", // Revert a commit
      ],
    ],
    "scope-enum": [
      2,
      "always",
      [
        "web", // apps/web
        "cli", // packages/cli
        "registry", // packages/registry
        "ui", // packages/ui
        "config", // Configuration
        "deps", // Dependencies
        "release", // Releases
      ],
    ],
    "scope-empty": [1, "never"], // Warn if no scope
  },
};
