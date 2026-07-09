import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSPAPIClient } from '../client/sp-api-client.js';
import { makeToolResponse } from './_shared/response.js';
import { marketplaceIdSchema } from './_shared/schemas.js';
import { resolveMarketplaceId, validateMarketplaceId } from './_shared/marketplace.js';

const itemConditionEnum = z.enum(['New', 'Used', 'Collectible', 'Refurbished', 'Club']);
const customerTypeEnum = z.enum(['Consumer', 'Business']);

const getPricingSchema = z
  .object({
    marketplaceId: marketplaceIdSchema.describe('Marketplace ID'),
    itemType: z.enum(['Asin', 'Sku']).describe('The item type: Asin or Sku'),
    asins: z.array(z.string()).max(20).optional().describe('Up to 20 ASINs (required when itemType is Asin)'),
    skus: z.array(z.string()).max(20).optional().describe('Up to 20 SKUs (required when itemType is Sku)'),
    itemCondition: itemConditionEnum.optional().describe('Filter by item condition'),
    offerType: z.enum(['B2C', 'B2B']).optional().describe('Filter by offer type'),
  })
  .refine(
    (v) => (v.itemType === 'Asin' && v.asins && v.asins.length > 0) || (v.itemType === 'Sku' && v.skus && v.skus.length > 0),
    { message: 'Provide asins when itemType is Asin, or skus when itemType is Sku' }
  );

const getCompetitivePricingSchema = getPricingSchema;

const getListingOffersSchema = z.object({
  sellerSKU: z.string().min(1).describe('The seller SKU to get offers for'),
  marketplaceId: marketplaceIdSchema.describe('Marketplace ID'),
  itemCondition: itemConditionEnum.describe('The item condition'),
  customerType: customerTypeEnum.optional().describe('Filter by customer type'),
});

const getItemOffersSchema = z.object({
  asin: z.string().min(1).describe('The ASIN to get offers for'),
  marketplaceId: marketplaceIdSchema.describe('Marketplace ID'),
  itemCondition: itemConditionEnum.describe('The item condition'),
  customerType: customerTypeEnum.optional().describe('Filter by customer type'),
});

const batchRequestItemSchema = z.object({
  asin: z.string().min(1),
  marketplaceId: marketplaceIdSchema,
  itemCondition: itemConditionEnum,
  customerType: customerTypeEnum.optional(),
});

const batchRequestListingSchema = z.object({
  sellerSKU: z.string().min(1),
  marketplaceId: marketplaceIdSchema,
  itemCondition: itemConditionEnum,
  customerType: customerTypeEnum.optional(),
});

const getItemOffersBatchSchema = z.object({
  requests: z.array(batchRequestItemSchema).max(20).describe('Up to 20 item offer requests'),
});

const getListingOffersBatchSchema = z.object({
  requests: z.array(batchRequestListingSchema).max(20).describe('Up to 20 listing offer requests'),
});

export function registerPricingV0Tools(server: McpServer): void {
  server.registerTool(
    'get_pricing',
    {
      description:
        'Get pricing information for items (by ASIN or SKU) including the current pricing, competitive pricing, and buy box price. Uses the Product Pricing v0 API.',
      inputSchema: getPricingSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const params: Record<string, unknown> = {
        MarketplaceId: marketplaceId,
        ItemType: input.itemType,
      };

      if (input.itemType === 'Asin' && input.asins) {
        params['Asins'] = input.asins;
      } else if (input.itemType === 'Sku' && input.skus) {
        params['Skus'] = input.skus;
      }

      if (input.itemCondition) params['ItemCondition'] = input.itemCondition;
      if (input.offerType) params['OfferType'] = input.offerType;

      const response = await client.get<{ pricing: unknown[] }>(
        '/products/pricing/v0/price',
        params,
        { rateLimitCategory: 'pricing' }
      );

      return makeToolResponse({ pricing: response?.pricing ?? [] });
    }
  );

  server.registerTool(
    'get_competitive_pricing',
    {
      description:
        'Get competitive pricing information for items (by ASIN or SKU) including the number of offers, lowest prices, and competitive pricing. Uses the Product Pricing v0 API.',
      inputSchema: getCompetitivePricingSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const params: Record<string, unknown> = {
        MarketplaceId: marketplaceId,
        ItemType: input.itemType,
      };

      if (input.itemType === 'Asin' && input.asins) {
        params['Asins'] = input.asins;
      } else if (input.itemType === 'Sku' && input.skus) {
        params['Skus'] = input.skus;
      }

      if (input.itemCondition) params['ItemCondition'] = input.itemCondition;
      if (input.offerType) params['OfferType'] = input.offerType;

      const response = await client.get<{ pricing: unknown[] }>(
        '/products/pricing/v0/competitivePrice',
        params,
        { rateLimitCategory: 'pricing' }
      );

      return makeToolResponse({ pricing: response?.pricing ?? [] });
    }
  );

  server.registerTool(
    'get_listing_offers',
    {
      description:
        'Get all offers for a seller SKU in a given marketplace. Returns pricing, shipping, and offer details for the listing.',
      inputSchema: getListingOffersSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const params: Record<string, unknown> = {
        MarketplaceId: marketplaceId,
        ItemCondition: input.itemCondition,
      };

      if (input.customerType) params['CustomerType'] = input.customerType;

      const response = await client.get(
        `/products/pricing/v0/listings/${encodeURIComponent(input.sellerSKU)}/offers`,
        params,
        { rateLimitCategory: 'pricing' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_item_offers',
    {
      description:
        'Get all offers for an ASIN in a given marketplace. Returns pricing, shipping, and offer details from all sellers.',
      inputSchema: getItemOffersSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const params: Record<string, unknown> = {
        MarketplaceId: marketplaceId,
        ItemCondition: input.itemCondition,
      };

      if (input.customerType) params['CustomerType'] = input.customerType;

      const response = await client.get(
        `/products/pricing/v0/items/${encodeURIComponent(input.asin)}/offers`,
        params,
        { rateLimitCategory: 'pricing' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_item_offers_batch',
    {
      description:
        'Batch request for item offers by ASIN. Submit up to 20 requests in a single call. Uses the Product Pricing v0 batch API.',
      inputSchema: getItemOffersBatchSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const requests = input.requests.map((req) => {
        const marketplaceId = resolveMarketplaceId(req.marketplaceId);
        validateMarketplaceId(marketplaceId);
        const request: Record<string, unknown> = {
          Uri: `/products/pricing/v0/items/${encodeURIComponent(req.asin)}/offers`,
          Method: 'GET',
          MarketplaceId: marketplaceId,
          ItemCondition: req.itemCondition,
        };
        if (req.customerType) request['CustomerType'] = req.customerType;
        return request;
      });

      const response = await client.post(
        '/batches/products/pricing/v0/itemOffers',
        { requests },
        { rateLimitCategory: 'pricing' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_listing_offers_batch',
    {
      description:
        'Batch request for listing offers by seller SKU. Submit up to 20 requests in a single call. Uses the Product Pricing v0 batch API.',
      inputSchema: getListingOffersBatchSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const requests = input.requests.map((req) => {
        const marketplaceId = resolveMarketplaceId(req.marketplaceId);
        validateMarketplaceId(marketplaceId);
        const request: Record<string, unknown> = {
          Uri: `/products/pricing/v0/listings/${encodeURIComponent(req.sellerSKU)}/offers`,
          Method: 'GET',
          MarketplaceId: marketplaceId,
          ItemCondition: req.itemCondition,
        };
        if (req.customerType) request['CustomerType'] = req.customerType;
        return request;
      });

      const response = await client.post(
        '/batches/products/pricing/v0/listingOffers',
        { requests },
        { rateLimitCategory: 'pricing' }
      );

      return makeToolResponse(response);
    }
  );
}
