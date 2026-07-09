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
    constructor(message: string) {
      super(message);
      this.name = 'AdsAPIError';
    }
  },
}));

import { registerNegativeTools } from '../src/tools/negative.js';

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

describe('negative keywords and targets tools', () => {
  let tools: Record<string, { handler: (input: unknown) => Promise<unknown>; schema: unknown }>;

  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
    const { server, tools: t } = makeServer();
    registerNegativeTools(server as any);
    tools = t;
  });

  describe('sp_list_negative_keywords', () => {
    it('should call correct endpoint with filters', async () => {
      const mockKeywords = [
        { keywordId: 1, campaignId: 100, adGroupId: 200, keywordText: 'test', matchType: 'NEGATIVE_EXACT', state: 'ENABLED' },
        { keywordId: 2, campaignId: 100, adGroupId: 201, keywordText: 'test2', matchType: 'NEGATIVE_PHRASE', state: 'PAUSED' },
      ];
      getMock.mockResolvedValue(mockKeywords);

      const result = await tools['sp_list_negative_keywords'].handler({
        stateFilter: 'ENABLED',
        campaignIdFilter: [100],
        adGroupIdFilter: [200, 201],
        pageSize: 50,
        startIndex: 0,
      });

      expect(getMock).toHaveBeenCalledWith(
        '/v2/sp/negativeKeywords',
        { stateFilter: 'ENABLED', campaignIdFilter: '100', adGroupIdFilter: '200,201', pageSize: 50, startIndex: 0 },
        { rateLimitCategory: 'negativeKeywords' }
      );
      expect(result).toMatchObject({
        structuredContent: { negativeKeywords: mockKeywords, count: 2 },
      });
    });

    it('should call endpoint with no filters', async () => {
      getMock.mockResolvedValue([]);

      await tools['sp_list_negative_keywords'].handler({});

      expect(getMock).toHaveBeenCalledWith(
        '/v2/sp/negativeKeywords',
        {},
        { rateLimitCategory: 'negativeKeywords' }
      );
    });
  });

  describe('sp_get_negative_keyword', () => {
    it('should call correct endpoint with keywordId', async () => {
      const mockKeyword = { keywordId: 42, campaignId: 100, adGroupId: 200, keywordText: 'test', matchType: 'NEGATIVE_EXACT', state: 'ENABLED' };
      getMock.mockResolvedValue(mockKeyword);

      const result = await tools['sp_get_negative_keyword'].handler({ keywordId: 42 });

      expect(getMock).toHaveBeenCalledWith(
        '/v2/sp/negativeKeywords/42',
        undefined,
        { rateLimitCategory: 'negativeKeywords' }
      );
      expect(result).toMatchObject({
        structuredContent: mockKeyword,
      });
    });
  });

  describe('sb_list_negative_keywords', () => {
    it('should call SB endpoint with filters', async () => {
      const mockKeywords = [
        { keywordId: 10, campaignId: 300, adGroupId: 400, keywordText: 'brand', matchType: 'NEGATIVE_EXACT', state: 'ENABLED' },
      ];
      getMock.mockResolvedValue(mockKeywords);

      const result = await tools['sb_list_negative_keywords'].handler({
        stateFilter: 'PAUSED',
        campaignIdFilter: [300],
      });

      expect(getMock).toHaveBeenCalledWith(
        '/v2/hs/negativeKeywords',
        { stateFilter: 'PAUSED', campaignIdFilter: '300' },
        { rateLimitCategory: 'negativeKeywords' }
      );
      expect(result).toMatchObject({
        structuredContent: { negativeKeywords: mockKeywords, count: 1 },
      });
    });
  });

  describe('sp_list_negative_targets', () => {
    it('should call correct endpoint with filters', async () => {
      const mockTargets = [
        { targetId: 1, campaignId: 100, adGroupId: 200, state: 'ENABLED', expressionType: 'asins', expression: [{ type: 'asin', value: 'B001' }] },
      ];
      getMock.mockResolvedValue(mockTargets);

      const result = await tools['sp_list_negative_targets'].handler({
        stateFilter: 'ENABLED',
        campaignIdFilter: [100],
        targetIdFilter: [1],
      });

      expect(getMock).toHaveBeenCalledWith(
        '/v2/sp/negativeTargets',
        { stateFilter: 'ENABLED', campaignIdFilter: '100', targetIdFilter: '1' },
        { rateLimitCategory: 'negativeTargets' }
      );
      expect(result).toMatchObject({
        structuredContent: { negativeTargets: mockTargets, count: 1 },
      });
    });
  });

  describe('sp_get_negative_target', () => {
    it('should call correct endpoint with targetId', async () => {
      const mockTarget = { targetId: 55, campaignId: 100, adGroupId: 200, state: 'ENABLED', expressionType: 'asins', expression: [{ type: 'asin', value: 'B001' }] };
      getMock.mockResolvedValue(mockTarget);

      const result = await tools['sp_get_negative_target'].handler({ targetId: 55 });

      expect(getMock).toHaveBeenCalledWith(
        '/v2/sp/negativeTargets/55',
        undefined,
        { rateLimitCategory: 'negativeTargets' }
      );
      expect(result).toMatchObject({
        structuredContent: mockTarget,
      });
    });
  });

  describe('sp_create_negative_keywords', () => {
    it('should POST to correct endpoint with keyword array', async () => {
      const input = {
        negativeKeywords: [
          { campaignId: 100, adGroupId: 200, keywordText: 'bad-term', matchType: 'NEGATIVE_EXACT' as const, state: 'ENABLED' as const },
          { campaignId: 100, adGroupId: 201, keywordText: 'another-bad', matchType: 'NEGATIVE_PHRASE' as const },
        ],
      };
      const mockCreated = [
        { keywordId: 1, campaignId: 100, adGroupId: 200, keywordText: 'bad-term', matchType: 'NEGATIVE_EXACT', state: 'ENABLED' },
        { keywordId: 2, campaignId: 100, adGroupId: 201, keywordText: 'another-bad', matchType: 'NEGATIVE_PHRASE', state: 'ENABLED' },
      ];
      postMock.mockResolvedValue(mockCreated);

      const result = await tools['sp_create_negative_keywords'].handler(input);

      expect(postMock).toHaveBeenCalledWith(
        '/v2/sp/negativeKeywords',
        input.negativeKeywords,
        { rateLimitCategory: 'negativeKeywords' }
      );
      expect(result).toMatchObject({
        structuredContent: { negativeKeywords: mockCreated, count: 2, message: 'Created 2 negative keyword(s)' },
      });
    });
  });

  describe('sp_update_negative_keywords', () => {
    it('should PUT to correct endpoint with updates', async () => {
      const input = {
        negativeKeywords: [
          { keywordId: 1, state: 'PAUSED' as const },
          { keywordId: 2, matchType: 'NEGATIVE_PHRASE' as const },
        ],
      };
      const mockUpdated = [
        { keywordId: 1, campaignId: 100, adGroupId: 200, keywordText: 'bad-term', matchType: 'NEGATIVE_EXACT', state: 'PAUSED' },
        { keywordId: 2, campaignId: 100, adGroupId: 201, keywordText: 'another-bad', matchType: 'NEGATIVE_PHRASE', state: 'ENABLED' },
      ];
      putMock.mockResolvedValue(mockUpdated);

      const result = await tools['sp_update_negative_keywords'].handler(input);

      expect(putMock).toHaveBeenCalledWith(
        '/v2/sp/negativeKeywords',
        input.negativeKeywords,
        { rateLimitCategory: 'negativeKeywords' }
      );
      expect(result).toMatchObject({
        structuredContent: { negativeKeywords: mockUpdated, count: 2, message: 'Updated 2 negative keyword(s)' },
      });
    });
  });

  describe('sp_delete_negative_keywords', () => {
    it('should DELETE with keyword IDs', async () => {
      const input = { negativeKeywordIds: [1, 2, 3] };
      const mockDeleted = [
        { keywordId: 1, campaignId: 100, adGroupId: 200, keywordText: 'bad-term', matchType: 'NEGATIVE_EXACT', state: 'DELETED' },
        { keywordId: 2, campaignId: 100, adGroupId: 201, keywordText: 'another-bad', matchType: 'NEGATIVE_PHRASE', state: 'DELETED' },
        { keywordId: 3, campaignId: 100, adGroupId: 202, keywordText: 'third-bad', matchType: 'NEGATIVE_EXACT', state: 'DELETED' },
      ];
      deleteMock.mockResolvedValue(mockDeleted);

      const result = await tools['sp_delete_negative_keywords'].handler(input);

      expect(deleteMock).toHaveBeenCalledWith(
        '/v2/sp/negativeKeywords',
        { keywordIds: [1, 2, 3] },
        { rateLimitCategory: 'negativeKeywords' }
      );
      expect(result).toMatchObject({
        structuredContent: { negativeKeywords: mockDeleted, count: 3, message: 'Deleted 3 negative keyword(s)' },
      });
    });
  });

  describe('sb_create_negative_keywords', () => {
    it('should POST to SB endpoint', async () => {
      const input = {
        negativeKeywords: [
          { campaignId: 500, adGroupId: 600, keywordText: 'competitor', matchType: 'NEGATIVE_EXACT' as const },
        ],
      };
      const mockCreated = [
        { keywordId: 10, campaignId: 500, adGroupId: 600, keywordText: 'competitor', matchType: 'NEGATIVE_EXACT', state: 'ENABLED' },
      ];
      postMock.mockResolvedValue(mockCreated);

      const result = await tools['sb_create_negative_keywords'].handler(input);

      expect(postMock).toHaveBeenCalledWith(
        '/v2/hs/negativeKeywords',
        input.negativeKeywords,
        { rateLimitCategory: 'negativeKeywords' }
      );
      expect(result).toMatchObject({
        structuredContent: { negativeKeywords: mockCreated, count: 1, message: 'Created 1 negative keyword(s)' },
      });
    });
  });

  describe('sp_create_negative_targets', () => {
    it('should POST to correct endpoint with target array', async () => {
      const input = {
        negativeTargets: [
          {
            campaignId: 100,
            adGroupId: 200,
            expressionType: 'asins',
            expression: [{ type: 'asin', value: 'B001' }],
            state: 'ENABLED' as const,
          },
        ],
      };
      const mockCreated = [
        { targetId: 1, campaignId: 100, adGroupId: 200, state: 'ENABLED', expressionType: 'asins', expression: [{ type: 'asin', value: 'B001' }] },
      ];
      postMock.mockResolvedValue(mockCreated);

      const result = await tools['sp_create_negative_targets'].handler(input);

      expect(postMock).toHaveBeenCalledWith(
        '/v2/sp/negativeTargets',
        input.negativeTargets,
        { rateLimitCategory: 'negativeTargets' }
      );
      expect(result).toMatchObject({
        structuredContent: { negativeTargets: mockCreated, count: 1, message: 'Created 1 negative target(s)' },
      });
    });
  });
});
