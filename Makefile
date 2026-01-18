# Sinew Development Makefile
# Common commands for local development

.PHONY: help install dev build lint format check test clean release

# Default target
help:
	@echo "Sinew Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install     - Install all dependencies"
	@echo "  make setup       - Full setup (install + generate)"
	@echo ""
	@echo "Development:"
	@echo "  make dev         - Start development servers"
	@echo "  make build       - Build all packages"
	@echo "  make lint        - Run linter"
	@echo "  make format      - Format code with Prettier"
	@echo "  make check       - Run all checks (lint + types + format)"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Run unit tests"
	@echo "  make test-e2e    - Run E2E tests"
	@echo ""
	@echo "Database (example app):"
	@echo "  make db-push     - Push schema to database"
	@echo "  make db-seed     - Seed database"
	@echo "  make db-studio   - Open Prisma Studio"
	@echo ""
	@echo "Release:"
	@echo "  make changeset   - Create a changeset"
	@echo "  make version     - Version packages"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make labels      - Sync GitHub labels"

# Setup
install:
	bun install

setup: install
	cd apps/example && bunx prisma generate
	cd examples/saas-starter && bunx prisma generate
	cd examples/with-prisma && bunx prisma generate

# Development
dev:
	bun run dev

build:
	bun run build

lint:
	bun run lint

format:
	bun run format

check: lint
	bun run check-types
	bun run format:check

# Testing
test:
	bun run test

test-e2e:
	cd apps/example && bun run test:e2e

# Database
db-push:
	cd apps/example && bun run db:push

db-seed:
	cd apps/example && bun run db:seed

db-studio:
	cd apps/example && bun run db:studio

# Release
changeset:
	bun changeset

version:
	bun run version-packages

# Utilities
clean:
	rm -rf node_modules/.cache
	rm -rf apps/*/.next
	rm -rf apps/*/node_modules/.cache
	rm -rf examples/*/.next
	rm -rf packages/*/dist
	find . -name "*.tsbuildinfo" -delete

labels:
	gh label import .github/labels.yml
