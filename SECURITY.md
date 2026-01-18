# Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in Sinew, please report it responsibly.

### How to Report

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email security concerns to: **security@marquis.codes**

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: We'll acknowledge receipt within 48 hours
- **Assessment**: We'll assess the vulnerability and determine its severity
- **Resolution**: We'll work on a fix and coordinate disclosure
- **Credit**: We'll credit you in the release notes (unless you prefer anonymity)

### Scope

This security policy applies to:

- The `sinew` CLI package
- The `@sinew/registry` package
- The documentation website at sinew.marquis.codes
- This GitHub repository

### Out of Scope

- Patterns copied into your project (you own that code)
- Third-party dependencies (report to their maintainers)
- Social engineering attacks

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Security Best Practices

When using Sinew patterns:

1. **Review the code** before adding to your project
2. **Keep dependencies updated** using Dependabot or Renovate
3. **Never commit secrets** - use environment variables
4. **Enable 2FA** on your npm and GitHub accounts

Thank you for helping keep Sinew and its users safe!
