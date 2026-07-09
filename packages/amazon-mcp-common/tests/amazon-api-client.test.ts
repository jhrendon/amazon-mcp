import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AmazonApiClient } from '../src/client/amazon-api-client.js';
import { TokenManager } from '../src/auth/token-manager.js';
import { createRateLimiter } from '../src/client/rate-limiter.js';

describe('AmazonApiClient', () => {
  let client: AmazonApiClient;
  let mockTokenManager: TokenManager;
  let mockRateLimiter: ReturnType<typeof createRateLimiter>;

  beforeEach(() => {
    mockTokenManager = new TokenManager({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      refreshToken: 'test-refresh-token',
    });

    // Mock getAccessToken
    vi.spyOn(mockTokenManager, 'getAccessToken').mockResolvedValue('test-access-token');
    vi.spyOn(mockTokenManager, 'clearCache').mockImplementation(() => {});

    mockRateLimiter = createRateLimiter({ requestsPerSecond: 100 });

    client = new AmazonApiClient({
      baseURL: 'https://test-api.amazon.com',
      tokenManager: mockTokenManager,
      rateLimiter: mockRateLimiter,
      authHeaderName: 'x-amz-access-token',
    });

    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with SP-API configuration', () => {
      const spClient = new AmazonApiClient({
        baseURL: 'https://sellingpartnerapi-na.amazon.com',
        tokenManager: mockTokenManager,
        rateLimiter: mockRateLimiter,
        authHeaderName: 'x-amz-access-token',
      });

      expect(spClient).toBeDefined();
    });

    it('should create client with Ads API configuration', () => {
      const adsClient = new AmazonApiClient({
        baseURL: 'https://advertising-api.amazon.com',
        tokenManager: mockTokenManager,
        rateLimiter: mockRateLimiter,
        authHeaderName: 'Authorization',
        authHeaderPrefix: 'Bearer',
        additionalHeaders: {
          'Amazon-Advertising-API-ClientId': 'test-client-id',
          'Amazon-Advertising-API-Scope': 'test-profile-id',
        },
      });

      expect(adsClient).toBeDefined();
    });
  });

  describe('configuration', () => {
    it('should accept custom error parser', () => {
      const customParser = (error: unknown) => ({
        code: 'CUSTOM_ERROR',
        message: 'Custom error message',
        retryable: false,
      });

      const customClient = new AmazonApiClient({
        baseURL: 'https://test-api.amazon.com',
        tokenManager: mockTokenManager,
        rateLimiter: mockRateLimiter,
        authHeaderName: 'x-amz-access-token',
        errorParser: customParser,
      });

      expect(customClient).toBeDefined();
    });

    it('should accept custom retry configuration', () => {
      const customClient = new AmazonApiClient({
        baseURL: 'https://test-api.amazon.com',
        tokenManager: mockTokenManager,
        rateLimiter: mockRateLimiter,
        authHeaderName: 'x-amz-access-token',
        maxRetries: 5,
        retryDelayMs: 2000,
      });

      expect(customClient).toBeDefined();
    });

    it('should accept custom timeout', () => {
      const customClient = new AmazonApiClient({
        baseURL: 'https://test-api.amazon.com',
        tokenManager: mockTokenManager,
        rateLimiter: mockRateLimiter,
        authHeaderName: 'x-amz-access-token',
        timeoutMs: 60000,
      });

      expect(customClient).toBeDefined();
    });
  });
});
