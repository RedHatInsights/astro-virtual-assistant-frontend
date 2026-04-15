@AGENTS.md

# Claude Code Configuration

## Build & Test Commands

```bash
# Install dependencies
npm install

# Development server (hot reload)
npm run start

# Build
npm run build

# Run all tests
npm test                 # Jest unit tests
npm run cypress:run:cp   # Cypress component tests (headless)

# Lint
npm run lint             # Runs both lint:js and lint:sass

# Full verification (build + lint)
npm run verify
```

## Pre-Commit Checklist

Before suggesting or creating commits, always run:

1. `npm run lint` — fix any lint errors
2. `npm test` — ensure all Jest tests pass
3. `npm run build` — ensure the build succeeds

## Local Backend

To connect to a local VA backend:

```bash
USE_LOCAL_RASA=1 npm run start
```

This proxies `/api/virtual-assistant/v2` to `http://localhost:5000`.
