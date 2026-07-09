import axios from 'axios';
import { AmazonApiClient, type AmazonApiError } from 'amazon-mcp-common';
import { getConfig } from '../config/index.js';
import { getTokenManager } from '../auth/token-manager.js';
import { getRateLimiter } from './rate-limiter.js';

export class SPAPIError extends Error {
  public code: string;
  public retryable: boolean;

  constructor(
    message: string,
    public statusCode?: number,
    errorCode?: string,
    retryable: boolean = false,
    public details?: string
  ) {
    super(message);
    this.name = 'SPAPIError';
    this.code = errorCode ?? 'UNKNOWN';
    this.retryable = retryable;
  }
}

function parseSPApiError(error: unknown): SPAPIError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 429) {
      return new SPAPIError(
        'Rate limited by Amazon SP-API. Please try again later.',
        429,
        'RATE_LIMITED',
        true
      );
    }

    if (status === 401) {
      return new SPAPIError(
        'Authentication failed. Please check your LWA credentials.',
        401,
        'UNAUTHORIZED',
        false
      );
    }

    if (status === 403) {
      return new SPAPIError(
        'Access forbidden. Please verify your seller permissions.',
        403,
        'FORBIDDEN',
        false
      );
    }

    if (status && status >= 500) {
      return new SPAPIError(
        `Amazon SP-API server error: ${status}`,
        status,
        'SERVER_ERROR',
        true
      );
    }

    if (status && status >= 400) {
      const apiError = data?.errors?.[0];
      const baseMessage = apiError?.message || data?.message || error.message;
      const details = apiError?.details;
      const errorMessage = details ? `${baseMessage} (${details})` : baseMessage;
      const errorCode = apiError?.code || 'CLIENT_ERROR';
      return new SPAPIError(errorMessage, status, errorCode, false, details);
    }

    if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT'
    ) {
      return new SPAPIError(
        `Network error: ${error.message}`,
        undefined,
        'NETWORK_ERROR',
        true
      );
    }

    return new SPAPIError(error.message);
  }

  if (error instanceof Error) {
    return new SPAPIError(error.message);
  }

  return new SPAPIError(String(error));
}

let clientInstance: AmazonApiClient | null = null;

export function getSPAPIClient(): AmazonApiClient {
  if (!clientInstance) {
    const config = getConfig();
    const tokenManager = getTokenManager();
    const rateLimiter = getRateLimiter('default');

    clientInstance = new AmazonApiClient({
      baseURL: config.SP_API_ENDPOINT,
      tokenManager,
      rateLimiter,
      authHeaderName: 'x-amz-access-token',
      errorParser: parseSPApiError as (error: unknown) => AmazonApiError,
      userAgent: 'amazon-seller-mcp/1.0.0 (Language=TypeScript)',
    });
  }
  return clientInstance;
}
