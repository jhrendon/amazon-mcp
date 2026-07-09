import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter } from 'amazon-mcp-common';

describe('RateLimiter token bucket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('consumes the full burst immediately', async () => {
    const limiter = createRateLimiter({ requestsPerSecond: 1, burstSize: 3 });

    const p1 = limiter.acquire();
    const p2 = limiter.acquire();
    const p3 = limiter.acquire();

    await expect(Promise.all([p1, p2, p3])).resolves.toEqual([undefined, undefined, undefined]);
  });

  it('makes requests beyond the burst wait until a token refills', async () => {
    const limiter = createRateLimiter({ requestsPerSecond: 1, burstSize: 2 });

    const p1 = limiter.acquire();
    const p2 = limiter.acquire();
    const p3 = limiter.acquire();

    await Promise.all([p1, p2]);

    let p3Resolved = false;
    void p3.then(() => { p3Resolved = true; });

    await vi.advanceTimersByTimeAsync(500);
    expect(p3Resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(600);
    await p3;
    expect(p3Resolved).toBe(true);
  });

  it('refills tokens over time', async () => {
    const limiter = createRateLimiter({ requestsPerSecond: 2, burstSize: 2 });

    const p1 = limiter.acquire();
    const p2 = limiter.acquire();
    await Promise.all([p1, p2]);

    expect(limiter.getAvailableTokens()).toBeLessThan(0.5);

    await vi.advanceTimersByTimeAsync(1000);

    expect(limiter.getAvailableTokens()).toBeGreaterThanOrEqual(1.5);
  });

  it('preserves FIFO queue order as tokens refill', async () => {
    const limiter = createRateLimiter({ requestsPerSecond: 1, burstSize: 1 });

    const order: number[] = [];

    const p1 = limiter.acquire().then(() => order.push(1));
    await p1;

    const p2 = limiter.acquire().then(() => order.push(2));
    const p3 = limiter.acquire().then(() => order.push(3));
    const p4 = limiter.acquire().then(() => order.push(4));

    await vi.advanceTimersByTimeAsync(1100);
    await p2;
    await vi.advanceTimersByTimeAsync(1100);
    await p3;
    await vi.advanceTimersByTimeAsync(1100);
    await p4;

    expect(order).toEqual([1, 2, 3, 4]);
  });
});
