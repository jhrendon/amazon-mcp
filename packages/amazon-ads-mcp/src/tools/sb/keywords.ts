import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../../client/ads-api-client.js';
import { makeToolResponse } from 'amazon-mcp-common';
import type { Keyword } from '../../types/ads.js';

const listKeywordsSchema = z.object({
  stateFilter: z.enum(['ENABLED', 'PAUSED', 'ARCHIVED']).optional().describe('Filter by keyword state'),
  campaignIdFilter: z.array(z.number()).optional().describe('Filter by campaign IDs'),
  adGroupIdFilter: z.array(z.number()).optional().describe('Filter by ad group IDs'),
  keywordIdFilter: z.array(z.number()).optional().describe('Filter by keyword IDs'),
  matchTypeFilter: z.enum(['EXACT', 'PHRASE', 'BROAD']).optional().describe('Filter by match type'),
  pageSize: z.number().min(1).max(1000).optional().describe('Number of results per page'),
  startIndex: z.number().min(0).optional().describe('Starting index for pagination'),
});

const getKeywordSchema = z.object({
  keywordId: z.number().describe('The keyword ID to retrieve'),
});

export function registerSBKeywordTools(server: McpServer): void {
  server.registerTool(
    'sb_list_keywords',
    {
      description: 'List all Sponsored Brands keywords. Requires Brand Registry.',
      inputSchema: listKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const params: Record<string, unknown> = {};
        if (input.stateFilter) params.stateFilter = input.stateFilter;
        if (input.campaignIdFilter) params.campaignIdFilter = input.campaignIdFilter.join(',');
        if (input.adGroupIdFilter) params.adGroupIdFilter = input.adGroupIdFilter.join(',');
        if (input.keywordIdFilter) params.keywordIdFilter = input.keywordIdFilter.join(',');
        if (input.matchTypeFilter) params.matchTypeFilter = input.matchTypeFilter;
        if (input.pageSize) params.pageSize = input.pageSize;
        if (input.startIndex !== undefined) params.startIndex = input.startIndex;

        const keywords = await client.get<Keyword[]>(
          '/v2/hs/keywords',
          params,
          { rateLimitCategory: 'keywords' }
        );

        return makeToolResponse({
          keywords: keywords.map((kw) => ({
            keywordId: kw.keywordId,
            campaignId: kw.campaignId,
            adGroupId: kw.adGroupId,
            keywordText: kw.keywordText,
            matchType: kw.matchType,
            state: kw.state,
            bid: kw.bid,
          })),
          count: keywords.length,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) {
          if (error.statusCode === 403) {
            throw new AdsAPIError(
              'Sponsored Brands API requires Brand Registry. Please activate Brand Registry in Seller Central.',
              403,
              'BRAND_REGISTRY_REQUIRED',
              false
            );
          }
          throw error;
        }
        throw new AdsAPIError(`Failed to list SB keywords: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sb_get_keyword',
    {
      description: 'Get details for a specific Sponsored Brands keyword by ID. Requires Brand Registry.',
      inputSchema: getKeywordSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const keyword = await client.get<Keyword>(
          `/v2/hs/keywords/${input.keywordId}`,
          undefined,
          { rateLimitCategory: 'keywords' }
        );

        return makeToolResponse({
          keywordId: keyword.keywordId,
          campaignId: keyword.campaignId,
          adGroupId: keyword.adGroupId,
          keywordText: keyword.keywordText,
          matchType: keyword.matchType,
          state: keyword.state,
          bid: keyword.bid,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) {
          if (error.statusCode === 403) {
            throw new AdsAPIError(
              'Sponsored Brands API requires Brand Registry. Please activate Brand Registry in Seller Central.',
              403,
              'BRAND_REGISTRY_REQUIRED',
              false
            );
          }
          throw error;
        }
        throw new AdsAPIError(`Failed to get SB keyword ${input.keywordId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
