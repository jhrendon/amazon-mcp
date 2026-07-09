import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSPAPIClient } from '../client/sp-api-client.js';
import { marketplaceIdSchema } from './_shared/schemas.js';
import { makeToolResponse } from './_shared/response.js';
import { resolveMarketplaceId, validateMarketplaceId } from './_shared/marketplace.js';
import type {
  CreateFulfillmentReturnResponse,
  FulfillmentOrderItem,
  FulfillmentOutboundAddress,
  FulfillmentReturnItem,
  GetFeatureInventoryResponse,
  GetFeatureSkuResponse,
  GetFeaturesResponse,
  GetFulfillmentOrderResponse,
  GetFulfillmentPreviewResponse,
  ListFulfillmentOrdersResponse,
  ListReturnReasonCodesResponse,
  PackageTrackingDetails,
} from '../types/sp-api.js';

const shippingSpeedCategorySchema = z.enum(['Standard', 'Expedited', 'Priority', 'ScheduledDelivery']);

const fulfillmentAddressSchema = z.object({
  name: z.string().optional(),
  line1: z.string().min(1),
  line2: z.string().optional(),
  line3: z.string().optional(),
  city: z.string().min(1),
  stateOrRegion: z.string().min(1),
  postalCode: z.string().min(1),
  countryCode: z.string().min(2).max(2),
});

const fulfillmentOrderItemSchema = z.object({
  sellerSku: z.string().min(1),
  sellerFulfillmentOrderItemId: z.string().optional(),
  quantity: z.number().int().positive(),
  giftMessage: z.string().optional(),
  displayableComment: z.string().optional(),
  orderItemDisposition: z.string().optional(),
  perUnitDeclaredValue: z
    .object({
      currencyCode: z.string().length(3),
      value: z.string().min(1),
    })
    .optional(),
  perUnitPrice: z
    .object({
      currencyCode: z.string().length(3),
      value: z.string().min(1),
    })
    .optional(),
  perUnitTax: z
    .object({
      currencyCode: z.string().length(3),
      value: z.string().min(1),
    })
    .optional(),
});

const sellerFulfillmentOrderIdSchema = z
  .string()
  .min(1)
  .describe('Seller-defined fulfillment order ID');

const getFulfillmentPreviewSchema = z.object({
  marketplaceId: marketplaceIdSchema.optional().describe('Marketplace ID (defaults to MARKETPLACE_ID env var)'),
  address: fulfillmentAddressSchema,
  items: z
    .array(
      z.object({
        sellerSku: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  shippingSpeedCategories: z.array(shippingSpeedCategorySchema).optional(),
});

const listFulfillmentOrdersSchema = z.object({
  queryStartDate: z.string().describe('ISO 8601 date. Orders updated after this date'),
  nextToken: z.string().optional(),
});

const createFulfillmentOrderSchema = z.object({
  sellerFulfillmentOrderId: z.string().min(1),
  displayableOrderId: z.string().min(1),
  displayableOrderDate: z.string().min(1),
  displayableOrderComment: z.string().optional(),
  shippingSpeedCategory: shippingSpeedCategorySchema,
  destinationAddress: fulfillmentAddressSchema,
  items: z.array(fulfillmentOrderItemSchema).min(1),
  marketplaceId: marketplaceIdSchema.optional().describe('Marketplace ID (defaults to MARKETPLACE_ID env var)'),
});

const getFulfillmentOrderSchema = z.object({
  sellerFulfillmentOrderId: sellerFulfillmentOrderIdSchema,
});

const updateFulfillmentOrderSchema = z.object({
  sellerFulfillmentOrderId: sellerFulfillmentOrderIdSchema,
  destinationAddress: fulfillmentAddressSchema.optional(),
  shippingSpeedCategory: shippingSpeedCategorySchema.optional(),
  items: z.array(fulfillmentOrderItemSchema).optional(),
});

const cancelFulfillmentOrderSchema = z.object({
  sellerFulfillmentOrderId: sellerFulfillmentOrderIdSchema,
});

const getPackageTrackingDetailsSchema = z.object({
  packageTrackingId: z.string().min(1).describe('Package tracking ID'),
});

const listReturnReasonCodesSchema = z.object({
  sellerSku: z.string().min(1),
  marketplaceId: marketplaceIdSchema.optional().describe('Marketplace ID (defaults to MARKETPLACE_ID env var)'),
  sellerFulfillmentOrderId: z.string().optional(),
});

const createFulfillmentReturnSchema = z.object({
  sellerFulfillmentOrderId: sellerFulfillmentOrderIdSchema,
  items: z
    .array(
      z.object({
        sellerReturnItemId: z.string().min(1),
        sellerFulfillmentOrderItemId: z.string().min(1),
        amazonShipmentId: z.string().min(1),
        returnReasonCode: z.string().min(1),
        returnComment: z.string().optional(),
      })
    )
    .min(1),
  returnId: z.string().optional(),
});

const getFeaturesSchema = z.object({
  marketplaceId: marketplaceIdSchema.optional().describe('Marketplace ID (defaults to MARKETPLACE_ID env var)'),
});

const getFeatureInventorySchema = z.object({
  featureName: z.string().min(1),
  marketplaceId: marketplaceIdSchema.optional().describe('Marketplace ID (defaults to MARKETPLACE_ID env var)'),
  nextToken: z.string().optional(),
});

const getFeatureSkuSchema = z.object({
  featureName: z.string().min(1),
  sellerSku: z.string().min(1),
  marketplaceId: marketplaceIdSchema.optional().describe('Marketplace ID (defaults to MARKETPLACE_ID env var)'),
});

function toFulfillmentAddress(input: z.infer<typeof fulfillmentAddressSchema>): FulfillmentOutboundAddress {
  return {
    name: input.name,
    line1: input.line1,
    line2: input.line2,
    line3: input.line3,
    city: input.city,
    stateOrRegion: input.stateOrRegion,
    postalCode: input.postalCode,
    countryCode: input.countryCode,
  };
}

function toFulfillmentOrderItems(
  inputs: z.infer<typeof fulfillmentOrderItemSchema>[]
): FulfillmentOrderItem[] {
  return inputs.map((item) => ({
    sellerSku: item.sellerSku,
    sellerFulfillmentOrderItemId: item.sellerFulfillmentOrderItemId,
    quantity: item.quantity,
    giftMessage: item.giftMessage,
    displayableComment: item.displayableComment,
    orderItemDisposition: item.orderItemDisposition,
    perUnitDeclaredValue: item.perUnitDeclaredValue
      ? { CurrencyCode: item.perUnitDeclaredValue.currencyCode, Amount: item.perUnitDeclaredValue.value }
      : undefined,
    perUnitPrice: item.perUnitPrice
      ? { CurrencyCode: item.perUnitPrice.currencyCode, Amount: item.perUnitPrice.value }
      : undefined,
    perUnitTax: item.perUnitTax
      ? { CurrencyCode: item.perUnitTax.currencyCode, Amount: item.perUnitTax.value }
      : undefined,
  }));
}

function toFulfillmentReturnItems(
  inputs: z.infer<typeof createFulfillmentReturnSchema>['items']
): FulfillmentReturnItem[] {
  return inputs.map((item) => ({
    sellerReturnItemId: item.sellerReturnItemId,
    sellerFulfillmentOrderItemId: item.sellerFulfillmentOrderItemId,
    amazonShipmentId: item.amazonShipmentId,
    returnReasonCode: item.returnReasonCode,
    returnComment: item.returnComment,
  }));
}

export function registerFulfillmentOutboundTools(server: McpServer): void {
  server.registerTool(
    'get_fulfillment_preview',
    {
      description: 'Get a fulfillment order preview for MCF (Multi-Channel Fulfillment).',
      inputSchema: getFulfillmentPreviewSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const request: Record<string, unknown> = {
        address: toFulfillmentAddress(input.address),
        items: input.items.map((item) => ({
          sellerSku: item.sellerSku,
          quantity: item.quantity,
        })),
      };

      if (input.shippingSpeedCategories) {
        request.shippingSpeedCategories = input.shippingSpeedCategories;
      }

      const response = await client.post<GetFulfillmentPreviewResponse>(
        '/fba/outbound/2020-07-01/fulfillmentOrders/preview',
        request,
        { rateLimitCategory: 'fulfillmentOutbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_fulfillment_orders',
    {
      description: 'List fulfillment orders for MCF (Multi-Channel Fulfillment) updated after a given date.',
      inputSchema: listFulfillmentOrdersSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const params: Record<string, unknown> = {
        queryStartDate: input.queryStartDate,
      };
      if (input.nextToken) params.nextToken = input.nextToken;

      const response = await client.get<ListFulfillmentOrdersResponse>(
        '/fba/outbound/2020-07-01/fulfillmentOrders',
        params,
        { rateLimitCategory: 'fulfillmentOutbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'create_fulfillment_order',
    {
      description: 'Create a fulfillment order for MCF (Multi-Channel Fulfillment).',
      inputSchema: createFulfillmentOrderSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const request: Record<string, unknown> = {
        sellerFulfillmentOrderId: input.sellerFulfillmentOrderId,
        displayableOrderId: input.displayableOrderId,
        displayableOrderDate: input.displayableOrderDate,
        shippingSpeedCategory: input.shippingSpeedCategory,
        destinationAddress: toFulfillmentAddress(input.destinationAddress),
        items: toFulfillmentOrderItems(input.items),
      };

      if (input.displayableOrderComment) {
        request.displayableOrderComment = input.displayableOrderComment;
      }

      const response = await client.post<Record<string, unknown>>(
        '/fba/outbound/2020-07-01/fulfillmentOrders',
        request,
        { rateLimitCategory: 'fulfillmentOutbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_fulfillment_order',
    {
      description: 'Get a fulfillment order by seller fulfillment order ID for MCF.',
      inputSchema: getFulfillmentOrderSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const response = await client.get<GetFulfillmentOrderResponse>(
        `/fba/outbound/2020-07-01/fulfillmentOrders/${encodeURIComponent(input.sellerFulfillmentOrderId)}`,
        undefined,
        { rateLimitCategory: 'fulfillmentOutbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'update_fulfillment_order',
    {
      description: 'Update a fulfillment order for MCF (Multi-Channel Fulfillment).',
      inputSchema: updateFulfillmentOrderSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const request: Record<string, unknown> = {};

      if (input.destinationAddress) {
        request.destinationAddress = toFulfillmentAddress(input.destinationAddress);
      }
      if (input.shippingSpeedCategory) {
        request.shippingSpeedCategory = input.shippingSpeedCategory;
      }
      if (input.items) {
        request.items = toFulfillmentOrderItems(input.items);
      }

      const response = await client.put<Record<string, unknown>>(
        `/fba/outbound/2020-07-01/fulfillmentOrders/${encodeURIComponent(input.sellerFulfillmentOrderId)}`,
        request,
        { rateLimitCategory: 'fulfillmentOutbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'cancel_fulfillment_order',
    {
      description: 'Cancel a fulfillment order for MCF (Multi-Channel Fulfillment).',
      inputSchema: cancelFulfillmentOrderSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const response = await client.put<Record<string, unknown>>(
        `/fba/outbound/2020-07-01/fulfillmentOrders/${encodeURIComponent(input.sellerFulfillmentOrderId)}/cancel`,
        undefined,
        { rateLimitCategory: 'fulfillmentOutbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_package_tracking_details',
    {
      description: 'Get package tracking details for MCF (Multi-Channel Fulfillment).',
      inputSchema: getPackageTrackingDetailsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const params: Record<string, unknown> = {
        packageTrackingId: input.packageTrackingId,
      };

      const response = await client.get<PackageTrackingDetails>(
        '/fba/outbound/2020-07-01/tracking',
        params,
        { rateLimitCategory: 'fulfillmentOutbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_return_reason_codes',
    {
      description: 'List return reason codes for MCF (Multi-Channel Fulfillment) returns.',
      inputSchema: listReturnReasonCodesSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const params: Record<string, unknown> = {
        sellerSku: input.sellerSku,
        marketplaceId,
      };
      if (input.sellerFulfillmentOrderId) {
        params.sellerFulfillmentOrderId = input.sellerFulfillmentOrderId;
      }

      const response = await client.get<ListReturnReasonCodesResponse>(
        '/fba/outbound/2020-07-01/returnReasonCodes',
        params,
        { rateLimitCategory: 'fulfillmentOutbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'create_fulfillment_return',
    {
      description: 'Create a fulfillment return for MCF (Multi-Channel Fulfillment).',
      inputSchema: createFulfillmentReturnSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const request: Record<string, unknown> = {
        items: toFulfillmentReturnItems(input.items),
      };

      if (input.returnId) {
        request.returnId = input.returnId;
      }

      const response = await client.put<CreateFulfillmentReturnResponse>(
        `/fba/outbound/2020-07-01/fulfillmentOrders/${encodeURIComponent(input.sellerFulfillmentOrderId)}/return`,
        request,
        { rateLimitCategory: 'fulfillmentOutbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_features',
    {
      description: 'Get available MCF (Multi-Channel Fulfillment) features.',
      inputSchema: getFeaturesSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const params: Record<string, unknown> = { marketplaceId };

      const response = await client.get<GetFeaturesResponse>(
        '/fba/outbound/2020-07-01/features',
        params,
        { rateLimitCategory: 'fulfillmentOutbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_feature_inventory',
    {
      description: 'Get inventory eligible for a specific MCF feature.',
      inputSchema: getFeatureInventorySchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const params: Record<string, unknown> = { marketplaceId };
      if (input.nextToken) params.nextToken = input.nextToken;

      const response = await client.get<GetFeatureInventoryResponse>(
        `/fba/outbound/2020-07-01/features/inventory/${encodeURIComponent(input.featureName)}`,
        params,
        { rateLimitCategory: 'fulfillmentOutbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_feature_sku',
    {
      description: 'Get feature eligibility for a specific SKU in MCF (Multi-Channel Fulfillment).',
      inputSchema: getFeatureSkuSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const params: Record<string, unknown> = { marketplaceId };

      const response = await client.get<GetFeatureSkuResponse>(
        `/fba/outbound/2020-07-01/features/inventory/${encodeURIComponent(input.featureName)}/${encodeURIComponent(input.sellerSku)}`,
        params,
        { rateLimitCategory: 'fulfillmentOutbound' }
      );

      return makeToolResponse(response);
    }
  );
}
