import { createRateLimiter, type RateLimiter, type RateLimiterConfig } from 'amazon-mcp-common';

export type { RateLimiter };

export const SP_API_RATE_LIMITS: Record<string, RateLimiterConfig> = {
  orders: { requestsPerSecond: 0.0167, burstSize: 20 },
  orderItems: { requestsPerSecond: 0.5, burstSize: 30 },
  createReport: { requestsPerSecond: 0.0167, burstSize: 15 },
  getReports: { requestsPerSecond: 0.0222, burstSize: 10 },
  getReport: { requestsPerSecond: 2, burstSize: 15 },
  getReportDocument: { requestsPerSecond: 0.0222, burstSize: 15 },
  sales: { requestsPerSecond: 0.5, burstSize: 15 },
  inventory: { requestsPerSecond: 2, burstSize: 2 },
  catalog: { requestsPerSecond: 2, burstSize: 2 },
  finances: { requestsPerSecond: 0.5, burstSize: 30 },
  invoices: { requestsPerSecond: 0.5, burstSize: 5 },
  productFees: { requestsPerSecond: 0.5, burstSize: 5 },
  customerFeedback: { requestsPerSecond: 1, burstSize: 5 },
  listings: { requestsPerSecond: 5, burstSize: 10 },
  pricing: { requestsPerSecond: 0.5, burstSize: 5 },
  solicitations: { requestsPerSecond: 1, burstSize: 5 },
  fbaInbound: { requestsPerSecond: 2, burstSize: 10 },
  tokens: { requestsPerSecond: 0.1, burstSize: 5 },
  merchantFulfillment: { requestsPerSecond: 1, burstSize: 5 },
  dataKiosk: { requestsPerSecond: 0.5, burstSize: 5 },
  feeds: { requestsPerSecond: 0.0222, burstSize: 10 },
  notifications: { requestsPerSecond: 1, burstSize: 5 },
  fulfillmentOutbound: { requestsPerSecond: 2, burstSize: 30 },
  productTypeDefinitions: { requestsPerSecond: 5, burstSize: 10 },
  listingsRestrictions: { requestsPerSecond: 5, burstSize: 10 },
  sellers: { requestsPerSecond: 0.016, burstSize: 15 },
  aplusContent: { requestsPerSecond: 10, burstSize: 10 },
  default: { requestsPerSecond: 1, burstSize: 5 },
};

const rateLimiters: Map<string, RateLimiter> = new Map();

export function getRateLimiter(category: string): RateLimiter {
  if (!rateLimiters.has(category)) {
    const config = SP_API_RATE_LIMITS[category] ?? SP_API_RATE_LIMITS.default;
    rateLimiters.set(category, createRateLimiter(config));
  }
  return rateLimiters.get(category)!;
}
