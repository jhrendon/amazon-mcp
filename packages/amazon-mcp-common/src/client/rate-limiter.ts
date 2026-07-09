export interface RateLimiterConfig {
  requestsPerSecond: number;
  burstSize?: number;
}

interface QueuedRequest {
  resolve: () => void;
  reject: (error: Error) => void;
}

export interface RateLimiter {
  acquire(): Promise<void>;
  getQueueLength(): number;
  getAvailableTokens(): number;
}

class TokenBucketRateLimiter implements RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private queue: QueuedRequest[] = [];
  private processing = false;

  constructor(config: RateLimiterConfig) {
    this.refillRate = config.requestsPerSecond;
    this.maxTokens = config.burstSize ?? Math.max(1, Math.ceil(config.requestsPerSecond));
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject });
      void this.processQueue();
    });
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getAvailableTokens(): number {
    this.refillTokens();
    return this.tokens;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      this.refillTokens();

      if (this.tokens >= 1) {
        this.tokens -= 1;
        const request = this.queue.shift();
        request?.resolve();
      } else {
        const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
        await sleep(Math.ceil(waitTime));
      }
    }

    this.processing = false;
  }
}

export function createRateLimiterFactory(
  configs: Record<string, RateLimiterConfig>
): (category: string) => RateLimiter {
  const limiters = new Map<string, RateLimiter>();

  return (category: string): RateLimiter => {
    if (!limiters.has(category)) {
      const config = configs[category];
      if (!config) {
        throw new Error(`No rate limit config for category: ${category}`);
      }
      limiters.set(category, new TokenBucketRateLimiter(config));
    }
    return limiters.get(category)!;
  };
}

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  return new TokenBucketRateLimiter(config);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
