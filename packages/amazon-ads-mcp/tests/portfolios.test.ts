import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('../src/client/ads-api-client.js', () => ({
  getAdsAPIClient: () => ({
    get: getMock,
    post: postMock,
    put: putMock,
    delete: deleteMock,
  }),
  AdsAPIError: class AdsAPIError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number) {
      super(message);
      this.name = 'AdsAPIError';
      this.statusCode = statusCode ?? 500;
    }
  },
}));

import { registerPortfolioTools } from '../src/tools/portfolios.js';

function makeServer() {
  const tools: Record<string, { handler: (input: unknown) => Promise<unknown>; schema: unknown }> = {};
  const server = {
    registerTool: (name: string, opts: { inputSchema: unknown }, handler: (input: unknown) => Promise<unknown>) => {
      tools[name] = { handler, schema: opts.inputSchema };
      return server;
    },
  };
  return { server, tools };
}

describe('portfolio tools', () => {
  let tools: Record<string, { handler: (input: unknown) => Promise<unknown>; schema: unknown }>;

  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
    const { server, tools: t } = makeServer();
    registerPortfolioTools(server as any);
    tools = t;
  });

  describe('list_portfolios', () => {
    it('should call correct endpoint with no filters', async () => {
      const mockPortfolios = [{ portfolioId: 1, name: 'Portfolio 1' }, { portfolioId: 2, name: 'Portfolio 2' }];
      getMock.mockResolvedValue(mockPortfolios);

      const result = await tools['list_portfolios'].handler({});

      expect(getMock).toHaveBeenCalledWith(
        '/v2/portfolios',
        undefined,
        { rateLimitCategory: 'portfolios' }
      );
      expect(result).toMatchObject({
        structuredContent: { portfolios: mockPortfolios, count: 2 },
      });
    });

    it('should pass filter params correctly', async () => {
      getMock.mockResolvedValue([{ portfolioId: 1, name: 'Portfolio 1' }]);

      await tools['list_portfolios'].handler({
        portfolioIdFilter: [1, 2],
        portfolioNameFilter: ['Portfolio 1'],
        portfolioStateFilter: 'enabled' as const,
      });

      expect(getMock).toHaveBeenCalledWith(
        '/v2/portfolios',
        { portfolioIdFilter: '1,2', portfolioNameFilter: 'Portfolio 1', portfolioStateFilter: 'enabled' },
        { rateLimitCategory: 'portfolios' }
      );
    });
  });

  describe('get_portfolio', () => {
    it('should call correct endpoint with portfolioId', async () => {
      const mockPortfolio = { portfolioId: 42, name: 'My Portfolio', state: 'enabled' };
      getMock.mockResolvedValue(mockPortfolio);

      const result = await tools['get_portfolio'].handler({ portfolioId: 42 });

      expect(getMock).toHaveBeenCalledWith(
        '/v2/portfolios/42',
        undefined,
        { rateLimitCategory: 'portfolios' }
      );
      expect(result).toMatchObject({
        structuredContent: mockPortfolio,
      });
    });
  });

  describe('create_portfolios', () => {
    it('should POST to correct endpoint with portfolio array', async () => {
      const input = {
        portfolios: [
          { name: 'New Portfolio', budget: { amount: 1000, currencyCode: 'USD' }, state: 'enabled' as const },
        ],
      };
      const mockCreated = [{ portfolioId: 10, name: 'New Portfolio', state: 'enabled' }];
      postMock.mockResolvedValue(mockCreated);

      const result = await tools['create_portfolios'].handler(input);

      expect(postMock).toHaveBeenCalledWith(
        '/v2/portfolios',
        input.portfolios,
        { rateLimitCategory: 'portfolios' }
      );
      expect(result).toMatchObject({
        structuredContent: { portfolios: mockCreated, count: 1, message: 'Created 1 portfolio(s)' },
      });
    });
  });

  describe('update_portfolios', () => {
    it('should PUT to correct endpoint with portfolio updates', async () => {
      const input = {
        portfolios: [
          { portfolioId: 10, name: 'Updated Portfolio', state: 'paused' as const },
        ],
      };
      const mockUpdated = [{ portfolioId: 10, name: 'Updated Portfolio', state: 'paused' }];
      putMock.mockResolvedValue(mockUpdated);

      const result = await tools['update_portfolios'].handler(input);

      expect(putMock).toHaveBeenCalledWith(
        '/v2/portfolios',
        input.portfolios,
        { rateLimitCategory: 'portfolios' }
      );
      expect(result).toMatchObject({
        structuredContent: { portfolios: mockUpdated, count: 1, message: 'Updated 1 portfolio(s)' },
      });
    });
  });

  describe('get_portfolio_extended', () => {
    it('should call correct endpoint with portfolioId', async () => {
      const mockExtended = { portfolioId: 42, name: 'My Portfolio', metrics: { totalSpend: 500 } };
      getMock.mockResolvedValue(mockExtended);

      const result = await tools['get_portfolio_extended'].handler({ portfolioId: 42 });

      expect(getMock).toHaveBeenCalledWith(
        '/v2/portfolios/extended/42',
        undefined,
        { rateLimitCategory: 'portfolios' }
      );
      expect(result).toMatchObject({
        structuredContent: mockExtended,
      });
    });
  });
});
