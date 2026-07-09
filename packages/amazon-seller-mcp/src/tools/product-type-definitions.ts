import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSPAPIClient } from '../client/sp-api-client.js';
import { makeToolResponse } from './_shared/response.js';
import { marketplaceIdSchema } from './_shared/schemas.js';

const searchProductTypeDefinitionsSchema = z.object({
  keywords: z.array(z.string()).optional().describe('Keywords to search for product types'),
  itemName: z.string().optional().describe('Item name to search for'),
  locale: z.string().optional().describe('Locale for the response (e.g., en_US)'),
  searchLocale: z.array(z.string()).optional().describe('Locales to search in'),
  marketplaceIds: z.array(marketplaceIdSchema).min(1).describe('Marketplace IDs to search in'),
});

const getProductTypeDefinitionSchema = z.object({
  productType: z.string().min(1).describe('The Amazon product type to retrieve the definition for'),
  sellerId: z.string().optional().describe('The seller ID'),
  marketplaceIds: z.array(marketplaceIdSchema).min(1).describe('Marketplace IDs'),
  locale: z.string().optional().describe('Locale for the response (e.g., en_US)'),
  requirements: z
    .enum(['LISTING', 'LISTING_PRODUCT_ONLY', 'LISTING_OFFER_ONLY', 'BROWSE_TREE_GUIDE'])
    .optional()
    .describe('The requirement set to return'),
  requirementsEnforced: z
    .enum(['ENFORCED', 'NOT_ENFORCED'])
    .optional()
    .describe('Whether requirements are enforced'),
  useCase: z
    .enum(['CREATE', 'UPDATE', 'REPLACE'])
    .optional()
    .describe('The use case for the definition'),
});

export function registerProductTypeDefinitionTools(server: McpServer): void {
  server.registerTool(
    'search_product_type_definitions',
    {
      description:
        'Search for Amazon product types by keywords or item name. Returns a list of matching product types with their names and descriptions. Useful for discovering the correct product type when creating or updating listings.',
      inputSchema: searchProductTypeDefinitionsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const params: Record<string, unknown> = {
        marketplaceIds: input.marketplaceIds.join(','),
      };

      if (input.keywords && input.keywords.length > 0) params['keywords'] = input.keywords.join(',');
      if (input.itemName) params['itemName'] = input.itemName;
      if (input.locale) params['locale'] = input.locale;
      if (input.searchLocale && input.searchLocale.length > 0) params['searchLocale'] = input.searchLocale.join(',');

      const response = await client.get(
        '/definitions/2020-09-01/productTypes',
        params,
        { rateLimitCategory: 'productTypeDefinitions' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_product_type_definition',
    {
      description:
        'Get the full definition for an Amazon product type, including all required and optional attributes. Use this to understand what fields are needed when creating or updating a listing for a specific product type.',
      inputSchema: getProductTypeDefinitionSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const params: Record<string, unknown> = {
        marketplaceIds: input.marketplaceIds.join(','),
      };

      if (input.sellerId) params['sellerId'] = input.sellerId;
      if (input.locale) params['locale'] = input.locale;
      if (input.requirements) params['requirements'] = input.requirements;
      if (input.requirementsEnforced) params['requirementsEnforced'] = input.requirementsEnforced;
      if (input.useCase) params['useCase'] = input.useCase;

      const response = await client.get(
        `/definitions/2020-09-01/productTypes/${encodeURIComponent(input.productType)}`,
        params,
        { rateLimitCategory: 'productTypeDefinitions' }
      );

      return makeToolResponse(response);
    }
  );
}
