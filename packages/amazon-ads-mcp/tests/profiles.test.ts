import { describe, it, expect } from 'vitest';
import { AdsAPIError } from '../src/client/ads-api-client.js';

describe('Ads API Error', () => {
  describe('AdsAPIError', () => {
    it('should create error with message', () => {
      const error = new AdsAPIError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AdsAPIError');
      expect(error.code).toBe('UNKNOWN');
      expect(error.retryable).toBe(false);
    });

    it('should create error with all properties', () => {
      const error = new AdsAPIError(
        'Rate limited',
        429,
        'RATE_LIMITED',
        true,
        'Too many requests'
      );
      
      expect(error.message).toBe('Rate limited');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMITED');
      expect(error.retryable).toBe(true);
      expect(error.details).toBe('Too many requests');
    });

    it('should be instanceof Error', () => {
      const error = new AdsAPIError('Test error');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AdsAPIError).toBe(true);
    });

    it('should have correct default values', () => {
      const error = new AdsAPIError('Test error', 400);
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('UNKNOWN');
      expect(error.retryable).toBe(false);
      expect(error.details).toBeUndefined();
    });
  });
});
