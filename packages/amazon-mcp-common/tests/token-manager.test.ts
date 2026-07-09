import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenManager } from '../src/auth/token-manager.js';
import axios from 'axios';

vi.mock('axios');

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  const mockConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    refreshToken: 'test-refresh-token',
  };

  beforeEach(() => {
    tokenManager = new TokenManager(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAccessToken', () => {
    it('should fetch a new token when cache is empty', async () => {
      const mockResponse = {
        data: {
          access_token: 'test-access-token',
          expires_in: 3600,
          token_type: 'bearer',
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const token = await tokenManager.getAccessToken();

      expect(token).toBe('test-access-token');
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.amazon.com/auth/o2/token',
        expect.any(URLSearchParams),
        expect.any(Object)
      );
    });

    it('should return cached token when valid', async () => {
      const mockResponse = {
        data: {
          access_token: 'cached-token',
          expires_in: 3600,
          token_type: 'bearer',
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      // First call to populate cache
      await tokenManager.getAccessToken();
      
      // Second call should use cache
      const token = await tokenManager.getAccessToken();

      expect(token).toBe('cached-token');
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('should refresh token when expired', async () => {
      const mockResponse1 = {
        data: {
          access_token: 'old-token',
          expires_in: 1, // Expires in 1 second
          token_type: 'bearer',
        },
      };

      const mockResponse2 = {
        data: {
          access_token: 'new-token',
          expires_in: 3600,
          token_type: 'bearer',
        },
      };

      vi.mocked(axios.post)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // First call
      await tokenManager.getAccessToken();

      // Wait for token to expire (with buffer)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second call should refresh
      const token = await tokenManager.getAccessToken();

      expect(token).toBe('new-token');
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    it('should include scope in request when configured', async () => {
      const configWithScope = {
        ...mockConfig,
        scope: 'advertising::campaign_management',
      };
      const managerWithScope = new TokenManager(configWithScope);

      const mockResponse = {
        data: {
          access_token: 'test-token',
          expires_in: 3600,
          token_type: 'bearer',
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      await managerWithScope.getAccessToken();

      const callArgs = vi.mocked(axios.post).mock.calls[0];
      const params = callArgs[1] as URLSearchParams;
      
      expect(params.get('scope')).toBe('advertising::campaign_management');
    });

    it('should handle token refresh errors', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Network error'));

      await expect(tokenManager.getAccessToken()).rejects.toThrow('Network error');
    });

    it('should prevent concurrent refresh requests', async () => {
      const mockResponse = {
        data: {
          access_token: 'test-token',
          expires_in: 3600,
          token_type: 'bearer',
        },
      };

      vi.mocked(axios.post).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      );

      // Make multiple concurrent requests
      const promises = [
        tokenManager.getAccessToken(),
        tokenManager.getAccessToken(),
        tokenManager.getAccessToken(),
      ];

      const tokens = await Promise.all(promises);

      // All should return the same token
      expect(tokens.every(t => t === 'test-token')).toBe(true);
      
      // Should only make one API call
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCache', () => {
    it('should clear cached token', async () => {
      const mockResponse = {
        data: {
          access_token: 'test-token',
          expires_in: 3600,
          token_type: 'bearer',
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      // Populate cache
      await tokenManager.getAccessToken();
      
      // Clear cache
      tokenManager.clearCache();
      
      // Next call should fetch new token
      await tokenManager.getAccessToken();

      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('isTokenExpired', () => {
    it('should return true when no token is cached', () => {
      expect(tokenManager.isTokenExpired()).toBe(true);
    });

    it('should return false when token is valid', async () => {
      const mockResponse = {
        data: {
          access_token: 'test-token',
          expires_in: 3600,
          token_type: 'bearer',
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      await tokenManager.getAccessToken();

      expect(tokenManager.isTokenExpired()).toBe(false);
    });
  });
});
