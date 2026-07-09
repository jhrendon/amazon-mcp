import axios from 'axios';

const DEFAULT_TOKEN_URL = 'https://api.amazon.com/auth/o2/token';
const DEFAULT_PRE_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

export interface TokenManagerConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  scope?: string;
  tokenEndpoint?: string;
  preExpiryBufferMs?: number;
}

export interface LWAValidationResult {
  accessToken: string;
  expiresAt: Date;
  scope?: string;
  tokenType: string;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
  scope?: string;
  tokenType: string;
}

interface LWATokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export class TokenManager {
  private cache: TokenCache | null = null;
  private refreshPromise: Promise<LWAValidationResult> | null = null;
  private readonly tokenEndpoint: string;
  private readonly preExpiryBufferMs: number;

  constructor(private readonly config: TokenManagerConfig) {
    this.tokenEndpoint = config.tokenEndpoint ?? DEFAULT_TOKEN_URL;
    this.preExpiryBufferMs = config.preExpiryBufferMs ?? DEFAULT_PRE_EXPIRY_BUFFER_MS;
  }

  async getToken(): Promise<LWAValidationResult> {
    if (this.isTokenValid()) {
      return this.toValidationResult(this.cache!);
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshToken();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async getAccessToken(): Promise<string> {
    const result = await this.getToken();
    return result.accessToken;
  }

  invalidateToken(): void {
    this.cache = null;
  }

  isTokenExpired(): boolean {
    return !this.isTokenValid();
  }

  getTokenExpiry(): Date | null {
    if (!this.cache) {
      return null;
    }
    return new Date(this.cache.expiresAt);
  }

  clearCache(): void {
    this.cache = null;
  }

  private isTokenValid(): boolean {
    if (!this.cache) {
      return false;
    }
    return Date.now() < this.cache.expiresAt - this.preExpiryBufferMs;
  }

  private async refreshToken(): Promise<LWAValidationResult> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.config.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    if (this.config.scope) {
      params.set('scope', this.config.scope);
    }

    try {
      const response = await axios.post<LWATokenResponse>(this.tokenEndpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, expires_in, scope, token_type } = response.data;

      this.cache = {
        accessToken: access_token,
        expiresAt: Date.now() + expires_in * 1000,
        scope,
        tokenType: token_type,
      };

      return this.toValidationResult(this.cache);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as
          | { error?: string; error_description?: string }
          | undefined;
        const message = data?.error_description || error.message;
        throw new Error(`Failed to refresh LWA access token: ${message}`);
      }
      throw error;
    }
  }

  private toValidationResult(cache: TokenCache): LWAValidationResult {
    return {
      accessToken: cache.accessToken,
      expiresAt: new Date(cache.expiresAt),
      scope: cache.scope,
      tokenType: cache.tokenType,
    };
  }
}
