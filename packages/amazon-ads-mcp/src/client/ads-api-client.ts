import { AmazonApiClient, type AmazonApiError } from 'amazon-mcp-common';
import { getConfig, getAdsApiEndpoint } from '../config/index.js';
import { getTokenManager } from '../auth/token-manager.js';
import { getRateLimiter } from './rate-limiter.js';
import axios from 'axios';

export class AdsAPIError extends Error {
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
    this.name = 'AdsAPIError';
    this.code = errorCode ?? 'UNKNOWN';
    this.retryable = retryable;
  }
}

function parseAdsApiError(error: unknown): AdsAPIError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as Record<string, unknown> | undefined;

    if (status === 429) {
      return new AdsAPIError(
        'Rate limited by Amazon Ads API. Please try again later.',
        429,
        'RATE_LIMITED',
        true
      );
    }

    if (status === 401) {
      return new AdsAPIError(
        'Authentication failed. Please check your LWA credentials and advertising scope.',
        401,
        'UNAUTHORIZED',
        false
      );
    }

    if (status === 403) {
      return new AdsAPIError(
        'Access forbidden. Please verify your advertising account permissions.',
        403,
        'FORBIDDEN',
        false
      );
    }

    if (status && status >= 500) {
      return new AdsAPIError(
        `Amazon Ads API server error: ${status}`,
        status,
        'SERVER_ERROR',
        true
      );
    }

    if (status && status >= 400) {
      const errors = data?.errors as Array<Record<string, string>> | undefined;
      const apiError = errors?.[0] ?? data;
      const baseMessage = (apiError?.message as string) || (data?.message as string) || error.message;
      const details = apiError?.details as string | undefined;
      const errorMessage = details ? `${baseMessage} (${details})` : baseMessage;
      const errorCode = (apiError?.code as string) || 'CLIENT_ERROR';
      return new AdsAPIError(errorMessage, status, errorCode, false, details);
    }

    if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT'
    ) {
      return new AdsAPIError(
        `Network error: ${error.message}`,
        undefined,
        'NETWORK_ERROR',
        true
      );
    }

    return new AdsAPIError(error.message);
  }

  if (error instanceof Error) {
    return new AdsAPIError(error.message);
  }

  return new AdsAPIError(String(error));
}

let clientInstance: AmazonApiClient | null = null;

export function getAdsAPIClient(): AmazonApiClient {
  if (!clientInstance) {
    const config = getConfig();
    const tokenManager = getTokenManager();
    const rateLimiter = getRateLimiter('default');
    const baseURL = getAdsApiEndpoint(config.ADS_API_REGION, config.ADS_API_ENDPOINT);

    clientInstance = new AmazonApiClient({
      baseURL,
      tokenManager,
      rateLimiter,
      authHeaderName: 'Authorization',
      authHeaderPrefix: 'Bearer',
      additionalHeaders: {
        'Amazon-Advertising-API-ClientId': config.LWA_CLIENT_ID,
        'Amazon-Advertising-API-Scope': config.ADS_PROFILE_ID,
      },
      errorParser: parseAdsApiError as (error: unknown) => AmazonApiError,
      userAgent: 'amazon-ads-mcp/1.0.0 (Language=TypeScript)',
    });
  }
  return clientInstance;
}
