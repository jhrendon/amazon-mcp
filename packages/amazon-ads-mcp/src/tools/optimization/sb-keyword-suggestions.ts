import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../../client/ads-api-client.js';
import { makeToolResponse } from 'amazon-mcp-common';

const getKeywordSuggestionsSchema = z.object({
  asin: z.string().min(1).describe('ASIN to get keyword suggestions for'),
  campaignId: z.number().optional().describe('Campaign ID to get suggestions for'),
});

export function registerSBKeywordSuggestionsTools(server: McpServer): void {
  server.registerTool(
    'sb_get_keyword_suggestions',
    {
      description: 'Get keyword suggestions for a specific ASIN. Requires Brand Registry.',
      inputSchema: getKeywordSuggestionsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const response = await client.post<{
          suggestedKeywords: Array<{
            keyword: string;
            matchType: string;
            bid: number;
          }>;
        }>(
          '/v2/hs/keywords/bidding/suggestions',
          {
            asin: input.asin,
            campaignId: input.campaignId,
          },
          { rateLimitCategory: 'suggestions' }
        );

        return makeToolResponse({
          asin: input.asin,
          suggestedKeywords: response.suggestedKeywords || [],
          count: response.suggestedKeywords?.length || 0,
          message: 'Keyword suggestions retrieved successfully',
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
        throw new AdsAPIError(`Failed to get SB keyword suggestions: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
