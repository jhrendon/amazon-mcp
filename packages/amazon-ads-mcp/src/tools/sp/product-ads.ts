import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../../client/ads-api-client.js';
import { makeToolResponse } from 'amazon-mcp-common';
import type { ProductAd } from '../../types/ads.js';

const listProductAdsSchema = z.object({
  stateFilter: z.enum(['ENABLED', 'PAUSED', 'ARCHIVED']).optional().describe('Filter by product ad state'),
  campaignIdFilter: z.array(z.number()).optional().describe('Filter by campaign IDs'),
  adGroupIdFilter: z.array(z.number()).optional().describe('Filter by ad group IDs'),
  pageSize: z.number().min(1).max(1000).optional().describe('Number of results per page'),
  startIndex: z.number().min(0).optional().describe('Starting index for pagination'),
});

const getProductAdSchema = z.object({
  adId: z.number().describe('The product ad ID to retrieve'),
});

export function registerSPProductAdTools(server: McpServer): void {
  server.registerTool(
    'sp_list_product_ads',
    {
      description: 'List all Sponsored Products product ads. Use filters to narrow results.',
      inputSchema: listProductAdsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const params: Record<string, unknown> = {};
        if (input.stateFilter) params.stateFilter = input.stateFilter;
        if (input.campaignIdFilter) params.campaignIdFilter = input.campaignIdFilter.join(',');
        if (input.adGroupIdFilter) params.adGroupIdFilter = input.adGroupIdFilter.join(',');
        if (input.pageSize) params.pageSize = input.pageSize;
        if (input.startIndex !== undefined) params.startIndex = input.startIndex;

        const productAds = await client.get<ProductAd[]>(
          '/v2/sp/productAds',
          params,
          { rateLimitCategory: 'productAds' }
        );

        return makeToolResponse({
          productAds: productAds.map((pa) => ({
            adId: pa.adId,
            campaignId: pa.campaignId,
            adGroupId: pa.adGroupId,
            asin: pa.asin,
            sku: pa.sku,
            state: pa.state,
          })),
          count: productAds.length,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to list SP product ads: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_get_product_ad',
    {
      description: 'Get details for a specific Sponsored Products product ad by ID.',
      inputSchema: getProductAdSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const productAd = await client.get<ProductAd>(
          `/v2/sp/productAds/${input.adId}`,
          undefined,
          { rateLimitCategory: 'productAds' }
        );

        return makeToolResponse({
          adId: productAd.adId,
          campaignId: productAd.campaignId,
          adGroupId: productAd.adGroupId,
          asin: productAd.asin,
          sku: productAd.sku,
          state: productAd.state,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SP product ad ${input.adId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
