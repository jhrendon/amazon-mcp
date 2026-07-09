# ADR-004: AmazonApiClient Design

**Status:** Accepted  
**Date:** 2026-07-08  
**Decision:** `AmazonApiClient` is a configurable class, not an inheritance hierarchy.

## Context

SP-API and Ads API have differences in:
- **Authentication headers**: SP-API uses `x-amz-access-token`, Ads API uses `Authorization: Bearer`
- **Additional headers**: Ads API requires `Amazon-Advertising-API-ClientId` and `Amazon-Advertising-API-Scope`
- **Error format**: Different error response structure
- **Base URLs**: Different endpoints per region

## Options Considered

### Option A: Inheritance hierarchy
- `AmazonApiClient` (base class)
- `SPApiClient extends AmazonApiClient`
- `AdsApiClient extends AmazonApiClient`

**Pros:**
- Clear separation by API
- Each subclass handles its own differences

**Cons:**
- Code duplication (retry, rate limiting, error handling)
- More classes to maintain
- Changes in the base affect all subclasses

### Option B: Configurable class (chosen)
- Single `AmazonApiClient` with injectable configuration
- Differences are handled via config (headers, error parser)
- No subclasses

**Pros:**
- Single client for both APIs
- Configurable without subclassing
- Avoids duplicating retry/backoff/rate-limiting code
- Easier to extend for new APIs

**Cons:**
- The `errorParser` must be provided by each project
- More complex configuration

### Option C: Composition with mixins
- `AmazonApiClient` + mixins for each API
- `SPApiClient = AmazonApiClient + SPHeaders + SPErrors`

**Pros:**
- Very flexible

**Cons:**
- Excessive complexity for TypeScript
- Less idiomatic
- Hard to type

## Decision

**Option B: Configurable class**

```typescript
interface AmazonApiClientConfig {
  baseURL: string;
  tokenManager: TokenManager;
  rateLimiter: RateLimiter;
  
  // Headers de autenticación
  authHeaderName: 'x-amz-access-token' | 'Authorization';
  authHeaderPrefix?: string;  // 'Bearer' para Ads API
  
  // Headers adicionales
  additionalHeaders?: Record<string, string>;
  
  // Error handling
  errorParser?: (response: any) => AmazonApiError;
  
  // Retry
  maxRetries?: number;  // Default: 3
  retryDelayMs?: number;  // Default: 1000
}
```

## Usage

### SP-API

```typescript
const client = new AmazonApiClient({
  baseURL: 'https://sellingpartnerapi-na.amazon.com',
  tokenManager: sellerTokenManager,
  rateLimiter: sellerRateLimiter,
  authHeaderName: 'x-amz-access-token',
  errorParser: parseSPApiError,
});
```

### Ads API

```typescript
const client = new AmazonApiClient({
  baseURL: 'https://advertising-api.amazon.com',
  tokenManager: adsTokenManager,
  rateLimiter: adsRateLimiter,
  authHeaderName: 'Authorization',
  authHeaderPrefix: 'Bearer',
  additionalHeaders: {
    'Amazon-Advertising-API-ClientId': config.clientId,
    'Amazon-Advertising-API-Scope': config.profileId,
  },
  errorParser: parseAdsApiError,
});
```

## Consequences

- ✅ Single client for both APIs
- ✅ Configurable without subclassing
- ✅ Avoids duplicating code
- ⚠️ Each project must provide its own `errorParser`
- ⚠️ More verbose configuration