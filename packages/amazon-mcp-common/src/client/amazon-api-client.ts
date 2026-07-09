import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { TokenManager } from '../auth/token-manager.js';
import type { RateLimiter } from './rate-limiter.js';

export type AuthHeaderName = 'x-amz-access-token' | 'Authorization';

export interface AmazonApiClientConfig {
  baseURL: string;
  tokenManager: TokenManager;
  rateLimiter: RateLimiter;
  authHeaderName: AuthHeaderName;
  authHeaderPrefix?: string;
  additionalHeaders?: Record<string, string>;
  errorParser?: (error: unknown) => AmazonApiError;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  userAgent?: string;
}

export interface AmazonApiError {
  code: string;
  message: string;
  details?: string;
  statusCode?: number;
  retryable: boolean;
}

export interface RequestOptions {
  rateLimitCategory?: string;
  retries?: number;
  retryDelayMs?: number;
  accessToken?: string;
  params?: Record<string, unknown>;
}

export class AmazonApiClient {
  private readonly client: AxiosInstance;
  private readonly defaultMaxRetries: number;
  private readonly defaultRetryDelayMs: number;
  private readonly rateLimiter: RateLimiter;
  private readonly errorParser: (error: unknown) => AmazonApiError;

  constructor(private readonly config: AmazonApiClientConfig) {
    this.defaultMaxRetries = config.maxRetries ?? 3;
    this.defaultRetryDelayMs = config.retryDelayMs ?? 1000;
    this.rateLimiter = config.rateLimiter;
    this.errorParser = config.errorParser ?? defaultErrorParser;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': config.userAgent ?? 'amazon-mcp/1.0.0 (Language=TypeScript)',
    };

    if (config.additionalHeaders) {
      Object.assign(headers, config.additionalHeaders);
    }

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeoutMs ?? 30000,
      headers,
    });

    this.client.interceptors.request.use(async (requestConfig) => {
      const existingToken = requestConfig.headers['x-amz-access-token']
        || requestConfig.headers['Authorization'];

      if (!existingToken) {
        const token = await config.tokenManager.getAccessToken();
        this.setAuthHeader(requestConfig, token);
      }

      return requestConfig;
    });
  }

  async get<T>(
    path: string,
    params?: Record<string, unknown>,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>({ method: 'GET', url: path, params, ...options });
  }

  async post<T>(
    path: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>({ method: 'POST', url: path, data, ...options });
  }

  async put<T>(
    path: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>({ method: 'PUT', url: path, data, ...options });
  }

  async delete<T>(
    path: string,
    params?: Record<string, unknown>,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>({ method: 'DELETE', url: path, params, ...options });
  }

  async patch<T>(
    path: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>({ method: 'PATCH', url: path, data, ...options });
  }

  async download(path: string, destPath: string, options: RequestOptions = {}): Promise<void> {
    const { writeFile } = await import('fs/promises');
    const { rateLimitCategory: _rateLimitCategory, ...axiosConfig } = options;
    
    await this.rateLimiter.acquire();
    
    const response = await this.client.get(path, {
      ...axiosConfig,
      responseType: 'arraybuffer',
    });
    await writeFile(destPath, Buffer.from(response.data));
  }

  private setAuthHeader(requestConfig: AxiosRequestConfig, token: string): void {
    if (this.config.authHeaderName === 'Authorization') {
      const prefix = this.config.authHeaderPrefix ?? 'Bearer';
      requestConfig.headers = requestConfig.headers ?? {};
      requestConfig.headers['Authorization'] = `${prefix} ${token}`;
    } else {
      requestConfig.headers = requestConfig.headers ?? {};
      requestConfig.headers['x-amz-access-token'] = token;
    }
  }

  private async request<T>(
    config: AxiosRequestConfig & RequestOptions
  ): Promise<T> {
    const {
      rateLimitCategory: _rateLimitCategory,
      retries = this.defaultMaxRetries,
      retryDelayMs = this.defaultRetryDelayMs,
      accessToken,
      ...axiosConfig
    } = config;

    if (accessToken) {
      axiosConfig.headers = axiosConfig.headers ?? {};
      this.setAuthHeader(axiosConfig as AxiosRequestConfig, accessToken);
    }

    await this.rateLimiter.acquire();

    let lastError: AmazonApiError | null = null;
    let tokenRefreshed = false;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response: AxiosResponse<T> = await this.client.request(axiosConfig);
        return response.data;
      } catch (error) {
        lastError = this.errorParser(error);

        if (lastError.statusCode === 401 && !tokenRefreshed) {
          this.config.tokenManager.clearCache();
          tokenRefreshed = true;
          continue;
        }

        if (lastError.retryable && attempt < retries) {
          const delay = retryDelayMs * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError;
  }
}

function defaultErrorParser(error: unknown): AmazonApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 429) {
      return {
        code: 'RATE_LIMITED',
        message: 'Rate limited by API. Please try again later.',
        statusCode: 429,
        retryable: true,
      };
    }

    if (status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed. Please check your credentials.',
        statusCode: 401,
        retryable: false,
      };
    }

    if (status === 403) {
      return {
        code: 'FORBIDDEN',
        message: 'Access forbidden. Please verify your permissions.',
        statusCode: 403,
        retryable: false,
      };
    }

    if (status && status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: `API server error: ${status}`,
        statusCode: status,
        retryable: true,
      };
    }

    if (status && status >= 400) {
      const data = error.response?.data as Record<string, unknown> | undefined;
      const apiError = (data?.errors as Array<Record<string, string>>)?.[0];
      const baseMessage = (apiError?.message as string)
        || (data?.message as string)
        || error.message;
      const details = apiError?.details;
      const message = details ? `${baseMessage} (${details})` : baseMessage;

      return {
        code: (apiError?.code as string) ?? 'CLIENT_ERROR',
        message,
        statusCode: status,
        retryable: false,
        details,
      };
    }

    if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT'
    ) {
      return {
        code: 'NETWORK_ERROR',
        message: `Network error: ${error.message}`,
        retryable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      retryable: false,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      retryable: false,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    retryable: false,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
