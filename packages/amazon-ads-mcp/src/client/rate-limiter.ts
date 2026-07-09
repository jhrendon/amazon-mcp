import { createRateLimiter, type RateLimiter, type RateLimiterConfig } from 'amazon-mcp-common';

export type { RateLimiter };

export const ADS_API_RATE_LIMITS: Record<string, RateLimiterConfig> = {
  campaigns: { requestsPerSecond: 2, burstSize: 10 },
  adGroups: { requestsPerSecond: 2, burstSize: 10 },
  keywords: { requestsPerSecond: 2, burstSize: 10 },
  productAds: { requestsPerSecond: 2, burstSize: 10 },
  targets: { requestsPerSecond: 2, burstSize: 10 },
  reports: { requestsPerSecond: 1, burstSize: 5 },
  profiles: { requestsPerSecond: 1, burstSize: 5 },
  suggestions: { requestsPerSecond: 1, burstSize: 5 },
  negativeKeywords: { requestsPerSecond: 2, burstSize: 10 },
  negativeTargets: { requestsPerSecond: 2, burstSize: 10 },
  sbStores: { requestsPerSecond: 2, burstSize: 10 },
  sbCreative: { requestsPerSecond: 2, burstSize: 10 },
  sbLandingPages: { requestsPerSecond: 2, burstSize: 10 },
  budgetRecommendations: { requestsPerSecond: 2, burstSize: 10 },
  bidRecommendations: { requestsPerSecond: 2, burstSize: 10 },
  budgetRules: { requestsPerSecond: 2, burstSize: 10 },
  portfolios: { requestsPerSecond: 2, burstSize: 10 },
  default: { requestsPerSecond: 1, burstSize: 5 },
};

const rateLimiters: Map<string, RateLimiter> = new Map();

export function getRateLimiter(category: string): RateLimiter {
  if (!rateLimiters.has(category)) {
    const config = ADS_API_RATE_LIMITS[category] ?? ADS_API_RATE_LIMITS.default;
    rateLimiters.set(category, createRateLimiter(config));
  }
  return rateLimiters.get(category)!;
}
