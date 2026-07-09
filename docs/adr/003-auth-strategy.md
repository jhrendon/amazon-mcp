# ADR-003: Authentication Strategy

**Status:** Accepted  
**Date:** 2026-07-08  
**Decision:** `TokenManager` accepts an optional `scope` parameter to support both SP-API and Ads API.

## Context

Amazon uses LWA OAuth 2.0 for authentication in both APIs:
- **SP-API** (Seller Central): Uses refresh token with SP-API scopes
- **Ads API**: Requires scope `advertising::campaign_management` in the token request

Both APIs use the same token endpoint (`https://api.amazon.com/auth/o2/token`) and the same OAuth 2.0 flow, but with differences in scopes.

## Options Considered

### Option A: Separate TokenManager per API
- `SellerTokenManager` for SP-API
- `AdsTokenManager` for Ads API

**Pros:**
- Clear separation

**Cons:**
- Code duplication
- Two classes that do almost the same thing
- More code to maintain

### Option B: Unified TokenManager with optional scope (chosen)
- Single `TokenManager` with optional `scope` parameter
- If scope is not provided, uses the refresh token's scope (SP-API)
- If scope is provided, includes it in the token request (Ads API)

**Pros:**
- Total reuse of auth code
- Single class to maintain
- Configurable per project

**Cons:**
- The refresh token must be authorized for the correct scopes (external configuration)

### Option C: TokenManager with factory
- `TokenManagerFactory.create('seller')` or `TokenManagerFactory.create('ads')`
- Factory decides which scope to use

**Pros:**
- More descriptive API

**Cons:**
- Unnecessary overhead for only two cases
- Less flexible than optional scope

## Decision

**Option B: Unified TokenManager with optional scope**

```typescript
interface TokenManagerConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  scope?: string;  // Opcional: para Ads API
  tokenEndpoint?: string;  // Default: https://api.amazon.com/auth/o2/token
  preExpiryBufferMs?: number;  // Default: 300000 (5 min)
}
```

## Implementation

- If `scope` is not provided, the token request does not include the `scope` parameter (SP-API uses the refresh token's scope)
- If `scope` is provided, it is included in the token request as `scope=advertising::campaign_management`

## External Configuration

The refresh token must be authorized for the correct scopes:
- **SP-API**: Refresh token authorized for SP-API scopes
- **Ads API**: Refresh token authorized for `advertising::campaign_management`

These are different tokens, configured in `.env`:
- `SELLER_REFRESH_TOKEN` for SP-API
- `ADS_REFRESH_TOKEN` for Ads API

## Consequences

- ✅ Total reuse of auth code
- ✅ Single class to maintain
- ✅ Configurable per project
- ⚠️ Requires separate refresh tokens for SP-API and Ads API