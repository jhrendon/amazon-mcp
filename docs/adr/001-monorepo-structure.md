# ADR-001: Monorepo Structure with pnpm Workspaces

**Status:** Accepted  
**Date:** 2026-07-08  
**Decision:** Use pnpm workspaces in a single repository for the three packages.

## Context

We have three related projects that share code:
1. `amazon-mcp-common` - shared library (auth, client, utils)
2. `amazon-seller-mcp` - Seller Central MCP (existing, will be migrated)
3. `amazon-ads-mcp` - Ads API MCP (new)

We need a structure that allows:
- Fast development with changes in common reflected instantly
- Integrated testing of all three packages
- Simplified CI/CD
- Consistent versioning

## Options Considered

### Option A: Separate repos + npm publish
- Each package in its own repository
- `amazon-mcp-common` is published to npm (private or public)
- MCPs import from npm

**Pros:**
- Total independence of each project
- Independent versioning

**Cons:**
- Versioning and publishing overhead
- Changes in common require publish + update in each MCP
- Three repositories to maintain
- More complex CI/CD

### Option B: pnpm workspaces (chosen)
- Single repository with `packages/` directory
- pnpm handles internal dependencies automatically
- Global scripts for build/test/lint

**Pros:**
- Changes in common are reflected instantly
- Single `node_modules` at root (disk efficient)
- Global scripts (`pnpm -r test`, `pnpm -r build`)
- Single repository to clone
- Simpler CI/CD

**Cons:**
- All projects share the same release cycle
- Requires pnpm (not npm or yarn)

### Option C: Turborepo + pnpm
- pnpm workspaces on top of Turborepo
- Build and task caching

**Pros:**
- Everything from Option B
- Intelligent build caching
- Better for CI/CD with many packages

**Cons:**
- More complex to set up
- Unnecessary overhead for only 3 packages

## Decision

**Option B: pnpm workspaces**

For 3 packages, pnpm workspaces is sufficient. Turborepo would be overkill. Separate repos would add unnecessary friction to development.

## Consequences

- ✅ Fast development (changes in common are reflected instantly)
- ✅ Single repository to clone and maintain
- ✅ Simplified CI/CD (single pipeline)
- ⚠️ Requires pnpm as package manager
- ⚠️ All projects share the same release cycle

## Migration

`amazon-seller-mcp` will be moved from `c:\Dev\amzn\amazon-seller-mcp` to `packages/amazon-seller-mcp/` in Phase 2.