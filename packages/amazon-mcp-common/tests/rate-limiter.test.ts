import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRateLimiter, createRateLimiterFactory } from '../src/client/rate-limiter.js';

describe('RateLimiter', () => {
  describe('createRateLimiter', () => {
    it('should create a rate limiter with default burst size', () => {
      const limiter = createRateLimiter({ requestsPerSecond: 10 });
      
      expect(limiter).toBeDefined();
      expect(limiter.getAvailableTokens()).toBe(10);
      expect(limiter.getQueueLength()).toBe(0);
    });

    it('should create a rate limiter with custom burst size', () => {
      const limiter = createRateLimiter({ 
        requestsPerSecond: 10, 
        burstSize: 5 
      });
      
      expect(limiter.getAvailableTokens()).toBe(5);
    });

    it('should acquire tokens and reduce available count', async () => {
      const limiter = createRateLimiter({ requestsPerSecond: 10 });
      
      await limiter.acquire();
      
      expect(limiter.getAvailableTokens()).toBeLessThan(10);
    });

    it('should queue requests when no tokens available', async () => {
      const limiter = createRateLimiter({ 
        requestsPerSecond: 1, 
        burstSize: 1 
      });
      
      // First request should succeed immediately
      await limiter.acquire();
      
      // Second request should be queued
      const secondRequest = limiter.acquire();
      
      expect(limiter.getQueueLength()).toBeGreaterThan(0);
      
      // Wait for token to refill
      await new Promise(resolve => setTimeout(resolve, 1100));
      await secondRequest;
      
      expect(limiter.getQueueLength()).toBe(0);
    });
  });

  describe('createRateLimiterFactory', () => {
    it('should create limiters for configured categories', () => {
      const factory = createRateLimiterFactory({
        campaigns: { requestsPerSecond: 10 },
        keywords: { requestsPerSecond: 5 },
      });
      
      const campaignsLimiter = factory('campaigns');
      const keywordsLimiter = factory('keywords');
      
      expect(campaignsLimiter).toBeDefined();
      expect(keywordsLimiter).toBeDefined();
      expect(campaignsLimiter.getAvailableTokens()).toBe(10);
      expect(keywordsLimiter.getAvailableTokens()).toBe(5);
    });

    it('should throw error for unconfigured category', () => {
      const factory = createRateLimiterFactory({
        campaigns: { requestsPerSecond: 10 },
      });
      
      expect(() => factory('unknown')).toThrow('No rate limit config for category: unknown');
    });

    it('should reuse same limiter instance for same category', () => {
      const factory = createRateLimiterFactory({
        campaigns: { requestsPerSecond: 10 },
      });
      
      const limiter1 = factory('campaigns');
      const limiter2 = factory('campaigns');
      
      expect(limiter1).toBe(limiter2);
    });
  });
});
