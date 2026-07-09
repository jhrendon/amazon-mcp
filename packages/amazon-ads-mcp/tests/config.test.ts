import { describe, it, expect } from 'vitest';
import { getAdsApiEndpoint, ADS_API_ENDPOINTS } from '../src/config/index.js';

describe('Ads API Endpoints', () => {
  describe('getAdsApiEndpoint', () => {
    it('should return NA endpoint by default', () => {
      const endpoint = getAdsApiEndpoint('na');
      expect(endpoint).toBe('https://advertising-api.amazon.com');
    });

    it('should return EU endpoint', () => {
      const endpoint = getAdsApiEndpoint('eu');
      expect(endpoint).toBe('https://advertising-api-eu.amazon.com');
    });

    it('should return FE endpoint', () => {
      const endpoint = getAdsApiEndpoint('fe');
      expect(endpoint).toBe('https://advertising-api-fe.amazon.com');
    });

    it('should return override when provided', () => {
      const endpoint = getAdsApiEndpoint('na', 'https://custom-endpoint.com');
      expect(endpoint).toBe('https://custom-endpoint.com');
    });
  });

  describe('ADS_API_ENDPOINTS', () => {
    it('should have all three regions', () => {
      expect(ADS_API_ENDPOINTS).toHaveProperty('na');
      expect(ADS_API_ENDPOINTS).toHaveProperty('eu');
      expect(ADS_API_ENDPOINTS).toHaveProperty('fe');
    });

    it('should have correct NA endpoint', () => {
      expect(ADS_API_ENDPOINTS.na).toBe('https://advertising-api.amazon.com');
    });

    it('should have correct EU endpoint', () => {
      expect(ADS_API_ENDPOINTS.eu).toBe('https://advertising-api-eu.amazon.com');
    });

    it('should have correct FE endpoint', () => {
      expect(ADS_API_ENDPOINTS.fe).toBe('https://advertising-api-fe.amazon.com');
    });
  });
});
