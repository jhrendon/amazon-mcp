import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SPAPIError } from '../src/client/sp-api-client.js';

vi.mock('../src/config/index.js', () => ({
  getConfig: () => ({
    LWA_CLIENT_ID: 'test',
    LWA_CLIENT_SECRET: 'test',
    LWA_REFRESH_TOKEN: 'test',
    SELLER_ID: 'test',
    MARKETPLACE_ID: 'ATVPDKIKX0DER',
    SP_API_ENDPOINT: 'https://sellingpartnerapi-na.amazon.com',
  }),
}));

vi.mock('../src/auth/token-manager.js', () => ({
  getTokenManager: () => ({
    getAccessToken: vi.fn().mockResolvedValue('token-abc'),
    clearCache: vi.fn(),
  }),
}));

describe('SPAPIError', () => {
  it('creates an error with the correct properties', () => {
    const error = new SPAPIError('Test error', 400, 'BAD_REQUEST', false, 'details');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.retryable).toBe(false);
    expect(error.details).toBe('details');
    expect(error.name).toBe('SPAPIError');
  });

  it('defaults retryable to false and code to UNKNOWN', () => {
    const error = new SPAPIError('Test error');
    expect(error.retryable).toBe(false);
    expect(error.code).toBe('UNKNOWN');
  });

  it('is an instance of Error', () => {
    const error = new SPAPIError('Test error');
    expect(error).toBeInstanceOf(Error);
  });

  it('can be thrown and caught', () => {
    expect(() => {
      throw new SPAPIError('Test error', 500, 'SERVER_ERROR', true);
    }).toThrow(SPAPIError);
  });
});
