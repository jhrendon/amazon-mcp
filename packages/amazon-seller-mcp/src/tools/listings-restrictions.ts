import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSPAPIClient } from '../client/sp-api-client.js';
import { makeToolResponse } from './_shared/response.js';
import { marketplaceIdSchema } from './_shared/schemas.js';

const getListingsRestrictionsSchema = z.object({
  asin: z.string().min(1).describe('The ASIN to check restrictions for'),
  conditionType: z
    .enum([
      'new_new',
      'used_like_new',
      'used_very_good',
      'used_good',
      'used_acceptable',
      'collectible_like_new',
      'collectible_very_good',
      'collectible_good',
      'collectible_acceptable',
      'club',
      'refurbished',
    ])
    .optional()
    .describe('The condition type to check'),
  sellerId: z.string().min(1).describe('The seller ID'),
  marketplaceIds: z.array(marketplaceIdSchema).min(1).describe('Marketplace IDs to check'),
  reasonLocale: z.string().optional().describe('Locale for restriction reasons (e.g., en_US)'),
});

export function registerListingsRestrictionsTools(server: McpServer): void {
  server.registerTool(
    'get_listings_restrictions',
    {
      description:
        'Check listing restrictions for an ASIN. Returns any restrictions that prevent a seller from listing a product, including restriction type and reason. Useful for understanding why a product cannot be listed.',
      inputSchema: getListingsRestrictionsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const params: Record<string, unknown> = {
        asin: input.asin,
        sellerId: input.sellerId,
        marketplaceIds: input.marketplaceIds.join(','),
      };

      if (input.conditionType) params['conditionType'] = input.conditionType;
      if (input.reasonLocale) params['reasonLocale'] = input.reasonLocale;

      const response = await client.get(
        '/listings/2021-08-01/restrictions',
        params,
        { rateLimitCategory: 'listingsRestrictions' }
      );

      return makeToolResponse(response);
    }
  );
}
