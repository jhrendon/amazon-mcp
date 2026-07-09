# Phase 0: amazon-mcp-common Contract

**Status:** Implemented  
**Date:** 2026-07-08  
**Last updated:** 2026-07-08 (synchronized with implementation)

This document defines the public contract of the `amazon-mcp-common` library. All exported interfaces and types are stable and will not change without a major version bump.

---

## 1. Auth Module

### TokenManager

Handles LWA OAuth 2.0 tokens with automatic caching and refresh before expiration.

```typescript
interface TokenManagerConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  scope?: string;  // Para Ads API: "advertising::campaign_management"
  tokenEndpoint?: string;  // Default: "https://api.amazon.com/auth/o2/token"
  preExpiryBufferMs?: number;  // Default: 300000 (5 min)
}

interface LWAValidationResult {
  accessToken: string;
  expiresAt: Date;
  scope?: string;
  tokenType: string;
}

class TokenManager {
  constructor(config: TokenManagerConfig);
  
  getToken(): Promise<LWAValidationResult>;
  getAccessToken(): Promise<string>;  // Convenience: returns only the token string
  invalidateToken(): void;
  isTokenExpired(): boolean;
  getTokenExpiry(): Date | null;
  clearCache(): void;  // Alias for invalidateToken()
}
```

### LWAValidator

Validates LWA credentials by attempting a token refresh. Returns an object with the validation result.

```typescript
interface LWAValidatorConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;  // Required: needed to attempt validation
  tokenEndpoint?: string;  // Default: "https://api.amazon.com/auth/o2/token"
}

interface LWAValidationResult {
  valid: boolean;
  error?: string;
}

class LWAValidator {
  constructor(config: LWAValidatorConfig);
  
  validateCredentials(): Promise<LWAValidationResult>;
}
```

**Note:** The `LWAValidationResult` from `LWAValidator` is different from the one in `TokenManager`. The `LWAValidator` one indicates whether the credentials are valid (`{ valid, error? }`), while the `TokenManager` one contains the token data (`{ accessToken, expiresAt, scope?, tokenType }`). Only the `TokenManager` version is re-exported from `index.ts`.

---

## 2. Client Module

### AmazonApiClient

Configurable HTTP client for Amazon APIs. Supports automatic retry, rate limiting, auto-refresh of tokens, and PATCH method.

```typescript
type AuthHeaderName = 'x-amz-access-token' | 'Authorization';

interface AmazonApiClientConfig {
  baseURL: string;
  tokenManager: TokenManager;
  rateLimiter: RateLimiter;
  
  // Authentication headers
  authHeaderName: AuthHeaderName;
  authHeaderPrefix?: string;  // 'Bearer' for Ads API
  
  // Additional headers
  additionalHeaders?: Record<string, string>;
  
  // Error handling
  errorParser?: (error: unknown) => AmazonApiError;
  
  // Retry
  maxRetries?: number;  // Default: 3
  retryDelayMs?: number;  // Default: 1000
  
  // Extras
  timeoutMs?: number;  // Default: 30000
  userAgent?: string;  // Default: "amazon-mcp/1.0.0 (Language=TypeScript)"
}

interface AmazonApiError {
  code: string;
  message: string;
  details?: string;
  statusCode?: number;
  retryable: boolean;
}

interface RequestOptions {
  rateLimitCategory?: string;
  retries?: number;
  retryDelayMs?: number;
  accessToken?: string;
  params?: Record<string, unknown>;
}

class AmazonApiClient {
  constructor(config: AmazonApiClientConfig);
  
  get<T>(path: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<T>;
  post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T>;
  put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T>;
  delete<T>(path: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T>;
  
  download(path: string, destPath: string, options?: RequestOptions): Promise<void>;
}
```

**Default Error Parser:** Automatically handles:
- `429` → `RATE_LIMITED` (retryable)
- `401` → `UNAUTHORIZED` (triggers token refresh)
- `403` → `FORBIDDEN`
- `5xx` → `SERVER_ERROR` (retryable)
- `4xx` → `CLIENT_ERROR` (extracts API message)
- Network errors → `NETWORK_ERROR` (retryable)

### RateLimiter

Token bucket rate limiter with FIFO queue.

```typescript
interface RateLimiterConfig {
  requestsPerSecond: number;
  burstSize?: number;  // Default: max(1, ceil(requestsPerSecond))
}

interface RateLimiter {
  acquire(): Promise<void>;
  getQueueLength(): number;
  getAvailableTokens(): number;
}

function createRateLimiterFactory(
  configs: Record<string, RateLimiterConfig>
): (category: string) => RateLimiter;

function createRateLimiter(config: RateLimiterConfig): RateLimiter;
```

---

## 3. Config Module

### Config Pattern

Pattern for loading and validating configuration from environment variables.

```typescript
import { z } from 'zod';

type ConfigSchema<T> = z.ZodSchema<T>;

function createConfigLoader<T>(schema: ConfigSchema<T>): () => T;
```

**Usage:**

```typescript
const configSchema = z.object({
  clientId: z.string(),
  profileId: z.string(),
  region: z.enum(['na', 'eu', 'fe']),
});

const loadConfig = createConfigLoader(configSchema);
const config = loadConfig();  // Validates and caches
```

---

## 4. MCP Utilities Module

### Response Helper

Helper for creating consistent MCP tool responses.

```typescript
interface ToolResponse<T> extends Record<string, unknown> {
  content: [{ type: 'text'; text: string }];
  structuredContent: T & Record<string, unknown>;
}

function makeToolResponse<T>(payload: T): ToolResponse<T>;
function makeErrorResponse(message: string): ToolResponse<never>;
```

**Note:** `makeErrorResponse` adds `isError: true` to the response at runtime (not declared in the `ToolResponse<T>` type).

### Shared Schemas

Shared Zod schemas for input validation.

```typescript
import { z } from 'zod';

const moneySchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid money amount'),
  currencyCode: z.string().length(3, 'Currency code must be 3 characters'),
});

const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date (YYYY-MM-DD)'),
});

const paginationSchema = z.object({
  pageSize: z.number().int().positive().max(1000).optional(),
  nextToken: z.string().optional(),
});
```

---

## 5. Utils Module

### CSV Parser

CSV parser with support for custom headers. **Default delimiter is tab (`\t`)** since Amazon reports are typically tab-delimited.

```typescript
interface CSVParserConfig {
  delimiter?: string;  // Default: '\t' (tab)
  hasHeaders?: boolean;  // Default: true
  quoteChar?: string;  // Default: '"'
  trimValues?: boolean;  // Default: true
}

function parseCSV<T = Record<string, string>>(
  csvData: string,
  config?: CSVParserConfig
): T[];

function parseCSVRow<T>(
  row: Record<string, string>,
  schema: Record<keyof T, 'string' | 'number' | 'boolean' | 'date'>
): T;
```

**Header normalization:** Headers are normalized to lowercase with underscores (e.g., `"Product Name"` → `"product_name"`).

### Report Poller

Poller for asynchronous reports from the SP-API Reports endpoint.

```typescript
type ReportProcessingStatus =
  | 'IN_QUEUE'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELLED'
  | 'FATAL';

interface ReportPollerConfig {
  client: AmazonApiClient;
  getStatusPath: (reportId: string) => string;
  getDownloadPath: (reportId: string) => string;
  pollIntervalMs?: number;  // Default: 5000
  maxPollAttempts?: number;  // Default: 120
  statusField?: string;  // Default: 'processingStatus'
  terminalStatuses?: string[];  // Default: ['DONE', 'CANCELLED', 'FATAL']
}

interface ReportStatus {
  reportId: string;
  status: ReportProcessingStatus;
  downloadUrl?: string;
  failureReason?: string;
}

interface PollOptions {
  maxWaitMs?: number;  // Default: 300000
  pollIntervalMs?: number;
  onStatusChange?: (status: ReportProcessingStatus) => void;
}

class ReportPoller {
  constructor(config: ReportPollerConfig);
  
  getReportStatus(reportId: string): Promise<ReportStatus>;
  waitForCompletion(reportId: string, options?: PollOptions): Promise<ReportStatus>;
  downloadReport(reportId: string, destPath: string): Promise<void>;
}
```

**Note:** The `ReportPoller` does not include a `createReport()` method. Report creation is handled directly in each tool using `client.post()`. Status values are `DONE`/`CANCELLED`/`FATAL` (not `COMPLETED`/`FAILED`).

**Automatic decompression:** Supports GZIP (detects magic bytes `0x1f 0x8b`), decompresses with `zlib.createGunzip`.

---

## 6. Types Module

### Common Types

```typescript
type AmazonRegion = 'na' | 'eu' | 'fe';

interface ApiEndpoint {
  region: AmazonRegion;
  url: string;
}

const ENDPOINTS: Record<string, ApiEndpoint[]> = {
  seller: [
    { region: 'na', url: 'https://sellingpartnerapi-na.amazon.com' },
    { region: 'eu', url: 'https://sellingpartnerapi-eu.amazon.com' },
    { region: 'fe', url: 'https://sellingpartnerapi-fe.amazon.com' },
  ],
  ads: [
    { region: 'na', url: 'https://advertising-api.amazon.com' },
    { region: 'eu', url: 'https://advertising-api-eu.amazon.com' },
    { region: 'fe', url: 'https://advertising-api-fe.amazon.com' },
  ],
};

const MARKETPLACE_IDS: Record<string, string> = {
  US: 'ATVPDKIKX0DER',
  CA: 'A2EUQ1WTGCTBG2',
  MX: 'A1AM78C64UM0Y8',
  BR: 'A2Q3Y263D00KWC',
  UK: 'A1F83G8C2ARO7P',
  DE: 'A1PA6795UKMFR9',
  FR: 'A13V1IB3VIYBER',
  IT: 'APJ6JRA9NG5V4',
  ES: 'A1RKKUPIHCS9HS',
  NL: 'A1805IZSGTT6HS',
  SE: 'A2NODRKZP88ZB9',
  PL: 'A1C3SOZRARQ6R3',
  BE: 'AMEN7PMS3EDWL',
  JP: 'A1VC38T7YXB528',
  AU: 'A39IBJ37TRP1C6',
  SG: 'A19VAU5U5O7RUS',
  IN: 'A21TJRUUN4KGV',
  AE: 'A2VIGQ35RCS4UG',
  SA: 'A17E79C6D8DWNP',
  EG: 'ARBP9OOSHTCHU',
  TR: 'A33AVAJ2PDY3EV',
};
```

---

## 7. Package Exports

```typescript
// packages/amazon-mcp-common/src/index.ts

// Auth
export { TokenManager } from './auth/token-manager.js';
export type { TokenManagerConfig, LWAValidationResult } from './auth/token-manager.js';
export { LWAValidator } from './auth/lwa-validator.js';
export type { LWAValidatorConfig } from './auth/lwa-validator.js';

// Client
export { AmazonApiClient } from './client/amazon-api-client.js';
export type { AmazonApiClientConfig, AmazonApiError, AuthHeaderName, RequestOptions } from './client/amazon-api-client.js';
export { createRateLimiter, createRateLimiterFactory } from './client/rate-limiter.js';
export type { RateLimiter, RateLimiterConfig } from './client/rate-limiter.js';

// Config
export { createConfigLoader } from './config/config-pattern.js';
export type { ConfigSchema } from './config/config-pattern.js';

// MCP Utilities
export { makeToolResponse, makeErrorResponse } from './mcp/response.js';
export type { ToolResponse } from './mcp/response.js';
export { moneySchema, dateRangeSchema, paginationSchema } from './mcp/schemas.js';

// Utils
export { parseCSV, parseCSVRow } from './utils/csv-parser.js';
export type { CSVParserConfig } from './utils/csv-parser.js';
export { ReportPoller } from './utils/report-poller.js';
export type { ReportPollerConfig, ReportStatus, ReportProcessingStatus, PollOptions } from './utils/report-poller.js';

// Types
export type { AmazonRegion, ApiEndpoint } from './types/common.js';
export { ENDPOINTS, MARKETPLACE_IDS } from './types/common.js';
```

---

## 8. Stability Criteria

- **Breaking changes** require major version bump
- **New exports** are minor version bumps
- **Bug fixes** are patch version bumps
- **Deprecated exports** are marked with `@deprecated` and maintained for at least 2 minor versions

---

## 9. Dependencies

- `@modelcontextprotocol/sdk` ^1.29.0
- `axios` ^1.14.0
- `zod` ^3.24.1
- `dotenv` ^16.4.7

**Note:** `axios-rate-limit` is not used. The implementation uses a custom rate limiter (token bucket with FIFO queue) in `client/rate-limiter.ts`.

---

## 10. Test Coverage

| File | Test File | Status |
|---|---|---|
| `auth/token-manager.ts` | `tests/token-manager.test.ts` | ✅ |
| `auth/lwa-validator.ts` | — | ❌ Missing |
| `client/amazon-api-client.ts` | `tests/amazon-api-client.test.ts` | ✅ |
| `client/rate-limiter.ts` | `tests/rate-limiter.test.ts` | ✅ |
| `config/config-pattern.ts` | — | ❌ Missing |
| `mcp/response.ts` | — | ❌ Missing |
| `mcp/schemas.ts` | — | ❌ Missing |
| `types/common.ts` | — | ❌ Missing |
| `utils/csv-parser.ts` | `tests/csv-parser.test.ts` | ✅ |
| `utils/report-poller.ts` | — | ❌ Missing |
