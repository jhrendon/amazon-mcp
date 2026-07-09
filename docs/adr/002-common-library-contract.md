# ADR-002: Contract for amazon-mcp-common

**Status:** Accepted  
**Date:** 2026-07-08  
**Decision:** Export only interfaces and concrete classes, not internal implementations.

## Context

`amazon-mcp-common` is a shared library used by `amazon-seller-mcp` and `amazon-ads-mcp`. We need to define what is exported and what is kept as internal implementation.

## Options Considered

### Option A: Export everything
- All files and functions are public
- Consumers can use anything

**Pros:**
- Maximum flexibility

**Cons:**
- No clear separation between public and internal
- Internal changes break consumers
- Unstable public API

### Option B: Export only interfaces and concrete classes (chosen)
- Only TypeScript interfaces and public classes are exported
- Internal implementations are not exported
- Clear public API documentation

**Pros:**
- Clear and stable public API
- Internal changes don't break consumers
- TypeScript `isolatedModules` ensures clean exports

**Cons:**
- Requires discipline to not accidentally export internals

### Option C: Export only functions
- Classes are not exported, only functions
- Easier to mock in tests

**Pros:**
- Easier to test

**Cons:**
- Loss of encapsulation provided by classes
- Less idiomatic for TypeScript

## Decision

**Option B: Export only interfaces and concrete classes**

The public API is defined in `packages/amazon-mcp-common/src/index.ts`. Only what is exported there is public. Everything else is internal.

## Public API

See `docs/openspec/phase-0-common-contract.md` for the full specification.

### Exported modules:

1. **Auth**: `TokenManager`, `LWAValidator`
2. **Client**: `AmazonApiClient`, `RateLimiter`, `createRateLimiterFactory`
3. **Config**: `createConfigLoader`
4. **MCP**: `makeToolResponse`, shared schemas
5. **Utils**: `parseCSV`, `ReportPoller`
6. **Types**: `AmazonRegion`, `ApiEndpoint`, `ENDPOINTS`

## Stability Criteria

- **Breaking changes** require major version bump
- **New exports** are minor version bumps
- **Bug fixes** are patch version bumps
- **Deprecated exports** are marked with `@deprecated` and maintained for at least 2 minor versions

## Consequences

- ✅ Clear and documented public API
- ✅ Internal changes don't break consumers
- ⚠️ Requires discipline to maintain separation