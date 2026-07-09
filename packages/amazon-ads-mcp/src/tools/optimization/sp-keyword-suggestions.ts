import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../../client/ads-api-client.js';
import { makeToolResponse } from 'amazon-mcp-common';

const getKeywordSuggestionsSchema = z.object({
  asin: z.string().min(1).describe('ASIN to get keyword suggestions for'),
  campaignId: z.number().optional().describe('Campaign ID to get suggestions for'),
});

export function registerSPKeywordSuggestionsTools(server: McpServer): void {
  server.registerTool(
    'sp_get_keyword_suggestions',
    {
      description: 'Get keyword suggestions for a specific ASIN. Returns suggested keywords with relevance scores.',
      inputSchema: getKeywordSuggestionsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const response = await client.post<{
          adGroupId: number;
          suggestedKeywords: Array<{
            keyword: string;
            matchType: string;
            bid: number;
          }>;
        }>(
          '/v2/sp/keywords/bidding/suggestions',
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
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SP keyword suggestions: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
