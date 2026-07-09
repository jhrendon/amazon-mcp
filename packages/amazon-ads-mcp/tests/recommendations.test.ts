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

import { registerRecommendationsTools } from '../src/tools/recommendations.js';

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

describe('recommendations tools', () => {
  let tools: Record<string, { handler: (input: unknown) => Promise<unknown>; schema: unknown }>;

  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
    const { server, tools: t } = makeServer();
    registerRecommendationsTools(server as any);
    tools = t;
  });

  describe('sp_get_budget_recommendations', () => {
    it('should POST to correct endpoint with campaignId', async () => {
      const mockResult = { recommendedBudget: 50.0, currencyCode: 'USD' };
      postMock.mockResolvedValue(mockResult);

      const result = await tools['sp_get_budget_recommendations'].handler({ campaignId: 100 });

      expect(postMock).toHaveBeenCalledWith(
        '/v2/sp/campaigns/budgetRecommendations',
        { campaignId: 100 },
        { rateLimitCategory: 'budgetRecommendations' }
      );
      expect(result).toMatchObject({
        structuredContent: mockResult,
      });
    });

    it('should include dateRange when provided', async () => {
      postMock.mockResolvedValue({});

      await tools['sp_get_budget_recommendations'].handler({
        campaignId: 100,
        dateRange: { startDate: '2025-01-01', endDate: '2025-01-31' },
      });

      expect(postMock).toHaveBeenCalledWith(
        '/v2/sp/campaigns/budgetRecommendations',
        { campaignId: 100, dateRange: { startDate: '2025-01-01', endDate: '2025-01-31' } },
        { rateLimitCategory: 'budgetRecommendations' }
      );
    });
  });

  describe('sp_get_campaign_budget_recommendations', () => {
    it('should POST batch endpoint with campaignIds', async () => {
      const mockResult = { recommendations: [{ campaignId: 100 }, { campaignId: 200 }] };
      postMock.mockResolvedValue(mockResult);

      const result = await tools['sp_get_campaign_budget_recommendations'].handler({
        campaignIds: [100, 200],
      });

      expect(postMock).toHaveBeenCalledWith(
        '/v2/sp/campaigns/budgetRecommendations/batch',
        { campaignIds: [100, 200] },
        { rateLimitCategory: 'budgetRecommendations' }
      );
      expect(result).toMatchObject({
        structuredContent: mockResult,
      });
    });
  });

  describe('sb_get_budget_recommendations', () => {
    it('should POST to SB endpoint with campaignId', async () => {
      const mockResult = { recommendedBudget: 75.0, currencyCode: 'USD' };
      postMock.mockResolvedValue(mockResult);

      const result = await tools['sb_get_budget_recommendations'].handler({ campaignId: 300 });

      expect(postMock).toHaveBeenCalledWith(
        '/v2/hs/campaigns/budgetRecommendations',
        { campaignId: 300 },
        { rateLimitCategory: 'budgetRecommendations' }
      );
      expect(result).toMatchObject({
        structuredContent: mockResult,
      });
    });
  });

  describe('sd_get_budget_recommendations', () => {
    it('should POST to SD endpoint with campaignId', async () => {
      const mockResult = { recommendedBudget: 60.0, currencyCode: 'USD' };
      postMock.mockResolvedValue(mockResult);

      const result = await tools['sd_get_budget_recommendations'].handler({ campaignId: 400 });

      expect(postMock).toHaveBeenCalledWith(
        '/sd/campaigns/budgetRecommendations',
        { campaignId: 400 },
        { rateLimitCategory: 'budgetRecommendations' }
      );
      expect(result).toMatchObject({
        structuredContent: mockResult,
      });
    });
  });

  describe('sp_get_bid_recommendations', () => {
    it('should POST to correct endpoint with adGroupId and keywords', async () => {
      const mockResult = { recommendations: [{ keywordText: 'test', suggestedBid: 1.5 }] };
      postMock.mockResolvedValue(mockResult);

      const result = await tools['sp_get_bid_recommendations'].handler({
        adGroupId: 200,
        keywords: [{ keywordText: 'test', matchType: 'EXACT' }],
      });

      expect(postMock).toHaveBeenCalledWith(
        '/v2/sp/keywords/bidding/recommendations',
        { adGroupId: 200, keywords: [{ keywordText: 'test', matchType: 'EXACT' }] },
        { rateLimitCategory: 'bidRecommendations' }
      );
      expect(result).toMatchObject({
        structuredContent: mockResult,
      });
    });

    it('should send only adGroupId when no keywords or targets', async () => {
      postMock.mockResolvedValue({});

      await tools['sp_get_bid_recommendations'].handler({ adGroupId: 200 });

      expect(postMock).toHaveBeenCalledWith(
        '/v2/sp/keywords/bidding/recommendations',
        { adGroupId: 200 },
        { rateLimitCategory: 'bidRecommendations' }
      );
    });
  });

  describe('sp_get_target_bid_recommendations', () => {
    it('should POST to correct endpoint with adGroupId and targets', async () => {
      const mockResult = { recommendations: [{ suggestedBid: 2.0 }] };
      postMock.mockResolvedValue(mockResult);

      const result = await tools['sp_get_target_bid_recommendations'].handler({
        adGroupId: 200,
        targets: [{ type: 'asin', value: 'B001' }],
      });

      expect(postMock).toHaveBeenCalledWith(
        '/v2/sp/targets/bidding/recommendations',
        { adGroupId: 200, targets: [{ type: 'asin', value: 'B001' }] },
        { rateLimitCategory: 'bidRecommendations' }
      );
      expect(result).toMatchObject({
        structuredContent: mockResult,
      });
    });
  });

  describe('sb_get_bid_recommendations', () => {
    it('should POST to SB endpoint with adGroupId and keywords', async () => {
      const mockResult = { recommendations: [{ keywordText: 'brand', suggestedBid: 3.0 }] };
      postMock.mockResolvedValue(mockResult);

      const result = await tools['sb_get_bid_recommendations'].handler({
        adGroupId: 500,
        keywords: [{ keywordText: 'brand', matchType: 'PHRASE' }],
      });

      expect(postMock).toHaveBeenCalledWith(
        '/v2/hs/keywords/bidding/recommendations',
        { adGroupId: 500, keywords: [{ keywordText: 'brand', matchType: 'PHRASE' }] },
        { rateLimitCategory: 'bidRecommendations' }
      );
      expect(result).toMatchObject({
        structuredContent: mockResult,
      });
    });
  });

  describe('sd_get_bid_recommendations', () => {
    it('should POST to SD endpoint with adGroupId', async () => {
      const mockResult = { recommendations: [{ suggestedBid: 1.8 }] };
      postMock.mockResolvedValue(mockResult);

      const result = await tools['sd_get_bid_recommendations'].handler({
        adGroupId: 600,
        targets: [{ type: 'asin', value: 'B002' }],
      });

      expect(postMock).toHaveBeenCalledWith(
        '/sd/targets/bidding/recommendations',
        { adGroupId: 600, targets: [{ type: 'asin', value: 'B002' }] },
        { rateLimitCategory: 'bidRecommendations' }
      );
      expect(result).toMatchObject({
        structuredContent: mockResult,
      });
    });
  });

  describe('sp_list_budget_rules', () => {
    it('should GET correct endpoint with no params', async () => {
      const mockRules = [{ ruleId: 1, name: 'Rule 1' }, { ruleId: 2, name: 'Rule 2' }];
      getMock.mockResolvedValue(mockRules);

      const result = await tools['sp_list_budget_rules'].handler({});

      expect(getMock).toHaveBeenCalledWith(
        '/v2/sp/campaigns/budgetRules',
        undefined,
        { rateLimitCategory: 'budgetRules' }
      );
      expect(result).toMatchObject({
        structuredContent: { budgetRules: mockRules, count: 2 },
      });
    });
  });

  describe('sp_create_budget_rule', () => {
    it('should POST to correct endpoint with rule data', async () => {
      const mockResult = { ruleId: 10, name: 'New Rule' };
      postMock.mockResolvedValue(mockResult);

      const result = await tools['sp_create_budget_rule'].handler({
        name: 'New Rule',
        ruleType: 'PERFORMANCE' as const,
        campaignIds: [100, 200],
        ruleDetails: { percentage: 10 },
      });

      expect(postMock).toHaveBeenCalledWith(
        '/v2/sp/campaigns/budgetRules',
        { name: 'New Rule', ruleType: 'PERFORMANCE', campaignIds: [100, 200], ruleDetails: { percentage: 10 } },
        { rateLimitCategory: 'budgetRules' }
      );
      expect(result).toMatchObject({
        structuredContent: mockResult,
      });
    });
  });

  describe('sp_update_budget_rule', () => {
    it('should PUT to correct endpoint with update data', async () => {
      const mockResult = { ruleId: 10, name: 'Updated Rule', state: 'PAUSED' };
      putMock.mockResolvedValue(mockResult);

      const result = await tools['sp_update_budget_rule'].handler({
        ruleId: 10,
        name: 'Updated Rule',
        state: 'PAUSED' as const,
      });

      expect(putMock).toHaveBeenCalledWith(
        '/v2/sp/campaigns/budgetRules',
        { ruleId: 10, name: 'Updated Rule', state: 'PAUSED' },
        { rateLimitCategory: 'budgetRules' }
      );
      expect(result).toMatchObject({
        structuredContent: mockResult,
      });
    });

    it('should send only ruleId when no optional fields', async () => {
      putMock.mockResolvedValue({ ruleId: 10 });

      await tools['sp_update_budget_rule'].handler({ ruleId: 10 });

      expect(putMock).toHaveBeenCalledWith(
        '/v2/sp/campaigns/budgetRules',
        { ruleId: 10 },
        { rateLimitCategory: 'budgetRules' }
      );
    });
  });
});
