import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSPAPIClient } from '../client/sp-api-client.js';
import { marketplaceIdSchema } from './_shared/schemas.js';
import { makeToolResponse } from './_shared/response.js';
import { resolveMarketplaceId, validateMarketplaceId } from './_shared/marketplace.js';
import type {
  CreateInboundPlanRequest,
  CreateInboundPlanResponse,
  InboundAddress,
  InboundItem,
  InboundPlan,
  InboundShipment,
  ListInboundPlanShipmentsResponse,
  ListInboundPlansResponse,
  ListInboundPlanItemsResponse,
  InboundOperationStatus,
  ListPackingOptionsResponse,
  ListPackingGroupBoxesResponse,
  ListPlacementOptionsResponse,
  ListTransportationOptionsResponse,
  ListPrepDetailsResponse,
  ListItemComplianceDetailsResponse,
  ListShipmentItemsResponse,
  ListShipmentBoxesResponse,
  ListShipmentPalletsResponse,
  ListDeliveryWindowOptionsResponse,
  CreateItemLabelsResponse,
} from '../types/sp-api.js';

const inboundPlanIdSchema = z
  .string()
  .min(1)
  .describe('FBA inbound plan ID');

const shipmentIdSchema = z
  .string()
  .min(1)
  .describe('FBA inbound shipment ID');

const listInboundPlansSchema = z.object({
  status: z.string().optional().describe('Filter by plan status'),
  sortBy: z.string().optional().describe('Field to sort by'),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
  pageSize: z.number().int().positive().optional().describe('Results per page'),
  paginationToken: z.string().optional().describe('Pagination token'),
  nextToken: z.string().optional().describe('Alias for paginationToken'),
  marketplaceId: marketplaceIdSchema.optional().describe('Marketplace ID (defaults to MARKETPLACE_ID env var)'),
});

const getInboundPlanSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  marketplaceId: marketplaceIdSchema.optional().describe('Marketplace ID (defaults to MARKETPLACE_ID env var)'),
});

const createInboundPlanSchema = z.object({
  marketplaceId: marketplaceIdSchema,
  originAddress: z.object({
    name: z.string().optional(),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    addressLine3: z.string().optional(),
    city: z.string().optional(),
    stateOrRegion: z.string().optional(),
    postalCode: z.string().optional(),
    countryCode: z.string().length(2).optional(),
    phone: z.string().optional(),
  }),
  items: z
    .array(
      z.object({
        asin: z.string().optional(),
        sellerSku: z.string().optional(),
        msKU: z.string().optional(),
        quantity: z.number().int().positive(),
        labelOwner: z.enum(['AMAZON', 'SELLER']).optional(),
        prepOwner: z.enum(['AMAZON', 'SELLER']).optional(),
        expiration: z.string().optional().describe('ISO 8601 expiration date'),
        manufacturingLotCode: z.string().optional(),
      })
    )
    .min(1)
    .describe('Inbound items (at least one required)'),
});

const listInboundPlanShipmentsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  pageSize: z.number().int().positive().optional(),
  paginationToken: z.string().optional(),
  nextToken: z.string().optional(),
  marketplaceId: marketplaceIdSchema.optional().describe('Marketplace ID (defaults to MARKETPLACE_ID env var)'),
});

const getInboundShipmentSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  shipmentId: shipmentIdSchema,
  marketplaceId: marketplaceIdSchema.optional().describe('Marketplace ID (defaults to MARKETPLACE_ID env var)'),
});

const cancelInboundPlanSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
});

const updateInboundPlanNameSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  name: z.string().min(1).describe('New name for the inbound plan'),
});

const listInboundPlanItemsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  pageSize: z.number().int().positive().optional(),
  paginationToken: z.string().optional(),
});

const setPackingInformationSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  packageGroupings: z.array(z.record(z.unknown())).min(1).describe('Package groupings array'),
});

const packingOptionIdSchema = z.string().min(1).describe('Packing option ID');

const listPackingOptionsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  pageSize: z.number().int().positive().optional(),
  paginationToken: z.string().optional(),
});

const generatePackingOptionsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
});

const confirmPackingOptionSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  packingOptionId: packingOptionIdSchema,
});

const listPackingGroupBoxesSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  packingGroupId: z.string().min(1).describe('Packing group ID'),
  pageSize: z.number().int().positive().optional(),
  paginationToken: z.string().optional(),
});

const placementOptionIdSchema = z.string().min(1).describe('Placement option ID');

const listPlacementOptionsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  pageSize: z.number().int().positive().optional(),
  paginationToken: z.string().optional(),
});

const generatePlacementOptionsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
});

const confirmPlacementOptionSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  placementOptionId: placementOptionIdSchema,
});

const listTransportationOptionsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  shipmentId: shipmentIdSchema,
  pageSize: z.number().int().positive().optional(),
  paginationToken: z.string().optional(),
});

const generateTransportationOptionsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
});

const confirmTransportationOptionsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
});

const listPrepDetailsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  pageSize: z.number().int().positive().optional(),
  paginationToken: z.string().optional(),
});

const setPrepDetailsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
});

const listItemComplianceDetailsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  pageSize: z.number().int().positive().optional(),
  paginationToken: z.string().optional(),
});

const updateItemComplianceDetailsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
});

const listShipmentItemsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  shipmentId: shipmentIdSchema,
  pageSize: z.number().int().positive().optional(),
  paginationToken: z.string().optional(),
});

const listShipmentBoxesSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  shipmentId: shipmentIdSchema,
  pageSize: z.number().int().positive().optional(),
  paginationToken: z.string().optional(),
});

const listShipmentPalletsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  shipmentId: shipmentIdSchema,
  pageSize: z.number().int().positive().optional(),
  paginationToken: z.string().optional(),
});

const updateShipmentNameSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  shipmentId: shipmentIdSchema,
  name: z.string().min(1).describe('New name for the shipment'),
});

const updateShipmentSourceAddressSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  shipmentId: shipmentIdSchema,
});

const updateShipmentTrackingDetailsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  shipmentId: shipmentIdSchema,
});

const createMarketplaceItemLabelsSchema = z.object({
  marketplaceId: marketplaceIdSchema.optional().describe('Marketplace ID (defaults to MARKETPLACE_ID env var)'),
});

const getInboundOperationStatusSchema = z.object({
  operationId: z.string().min(1).describe('Operation ID'),
});

const listDeliveryWindowOptionsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  shipmentId: shipmentIdSchema,
  pageSize: z.number().int().positive().optional(),
  paginationToken: z.string().optional(),
});

const generateDeliveryWindowOptionsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  shipmentId: shipmentIdSchema,
});

const deliveryWindowOptionIdSchema = z.string().min(1).describe('Delivery window option ID');

const confirmDeliveryWindowOptionsSchema = z.object({
  inboundPlanId: inboundPlanIdSchema,
  shipmentId: shipmentIdSchema,
  deliveryWindowOptionId: deliveryWindowOptionIdSchema,
});

function toInboundAddress(input: z.infer<typeof createInboundPlanSchema>['originAddress']): InboundAddress {
  return {
    name: input.name,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    addressLine3: input.addressLine3,
    city: input.city,
    stateOrRegion: input.stateOrRegion,
    postalCode: input.postalCode,
    countryCode: input.countryCode,
    phone: input.phone,
  };
}

function toInboundItems(
  inputs: z.infer<typeof createInboundPlanSchema>['items']
): InboundItem[] {
  return inputs.map((item) => ({
    asin: item.asin,
    sellerSku: item.sellerSku,
    msKU: item.msKU,
    quantity: item.quantity,
    labelOwner: item.labelOwner,
    prepOwner: item.prepOwner,
    expiration: item.expiration,
    manufacturingLotCode: item.manufacturingLotCode,
  }));
}

export function registerFBAInboundTools(server: McpServer): void {
  server.registerTool(
    'list_inbound_plans',
    {
      description: 'List FBA inbound plans for the seller account with pagination support.',
      inputSchema: listInboundPlansSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const params: Record<string, unknown> = { marketplaceId };
      if (input.status) params.status = input.status;
      if (input.sortBy) params.sortBy = input.sortBy;
      if (input.sortOrder) params.sortOrder = input.sortOrder;
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.paginationToken) params.paginationToken = input.paginationToken;
      if (input.nextToken) params.paginationToken = input.nextToken;

      const response = await client.get<ListInboundPlansResponse>(
        '/inbound/fba/2024-03-20/inboundPlans',
        params,
        { rateLimitCategory: 'fbaInbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_inbound_plan',
    {
      description: 'Get detailed information about a specific FBA inbound plan.',
      inputSchema: getInboundPlanSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const response = await client.get<InboundPlan>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}`,
        { marketplaceId },
        { rateLimitCategory: 'fbaInbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'create_inbound_plan',
    {
      description:
        'Create a new FBA inbound plan with a source address and a list of items. Returns the created inbound plan ID.',
      inputSchema: createInboundPlanSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const request: CreateInboundPlanRequest = {
        marketplaceId,
        originAddress: toInboundAddress(input.originAddress),
        items: toInboundItems(input.items),
      };

      const response = await client.post<CreateInboundPlanResponse>(
        '/inbound/fba/2024-03-20/inboundPlans',
        request,
        { rateLimitCategory: 'fbaInbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_inbound_plan_shipments',
    {
      description: 'List shipments for a specific FBA inbound plan.',
      inputSchema: listInboundPlanShipmentsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const params: Record<string, unknown> = { marketplaceId };
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.paginationToken) params.paginationToken = input.paginationToken;
      if (input.nextToken) params.paginationToken = input.nextToken;

      const response = await client.get<ListInboundPlanShipmentsResponse>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/shipments`,
        params,
        { rateLimitCategory: 'fbaInbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_inbound_shipment',
    {
      description: 'Get detailed information about a specific FBA inbound shipment.',
      inputSchema: getInboundShipmentSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const response = await client.get<InboundShipment>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/shipments/${encodeURIComponent(input.shipmentId)}`,
        { marketplaceId },
        { rateLimitCategory: 'fbaInbound' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'cancel_inbound_plan',
    {
      description: 'Cancel a merchant fulfillment shipment before the label is printed.',
      inputSchema: cancelInboundPlanSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.put<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/cancellation`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'update_inbound_plan_name',
    {
      description: 'Update the name of an FBA inbound plan.',
      inputSchema: updateInboundPlanNameSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.put<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/name`,
        { name: input.name },
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_inbound_plan_items',
    {
      description: 'List items in an FBA inbound plan.',
      inputSchema: listInboundPlanItemsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const params: Record<string, unknown> = {};
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.paginationToken) params.paginationToken = input.paginationToken;
      const response = await client.get<ListInboundPlanItemsResponse>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/items`,
        params,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'set_packing_information',
    {
      description: 'Set packing information for an FBA inbound plan.',
      inputSchema: setPackingInformationSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.post<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/packingInformation`,
        { packageGroupings: input.packageGroupings },
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_packing_options',
    {
      description: 'List packing options for an FBA inbound plan.',
      inputSchema: listPackingOptionsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const params: Record<string, unknown> = {};
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.paginationToken) params.paginationToken = input.paginationToken;
      const response = await client.get<ListPackingOptionsResponse>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/packingOptions`,
        params,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'generate_packing_options',
    {
      description: 'Generate packing options for an FBA inbound plan.',
      inputSchema: generatePackingOptionsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.post<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/packingOptions`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'confirm_packing_option',
    {
      description: 'Confirm a packing option for an FBA inbound plan.',
      inputSchema: confirmPackingOptionSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.post<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/packingOptions/${encodeURIComponent(input.packingOptionId)}/confirmation`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_packing_group_boxes',
    {
      description: 'List boxes in a packing group for an FBA inbound plan.',
      inputSchema: listPackingGroupBoxesSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const params: Record<string, unknown> = {};
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.paginationToken) params.paginationToken = input.paginationToken;
      const response = await client.get<ListPackingGroupBoxesResponse>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/packingGroups/${encodeURIComponent(input.packingGroupId)}/boxes`,
        params,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_placement_options',
    {
      description: 'List placement options for an FBA inbound plan.',
      inputSchema: listPlacementOptionsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const params: Record<string, unknown> = {};
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.paginationToken) params.paginationToken = input.paginationToken;
      const response = await client.get<ListPlacementOptionsResponse>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/placementOptions`,
        params,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'generate_placement_options',
    {
      description: 'Generate placement options for an FBA inbound plan.',
      inputSchema: generatePlacementOptionsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.post<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/placementOptions`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'confirm_placement_option',
    {
      description: 'Confirm a placement option for an FBA inbound plan.',
      inputSchema: confirmPlacementOptionSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.post<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/placementOptions/${encodeURIComponent(input.placementOptionId)}/confirmation`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_transportation_options',
    {
      description: 'List transportation options for a shipment in an FBA inbound plan.',
      inputSchema: listTransportationOptionsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const params: Record<string, unknown> = {};
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.paginationToken) params.paginationToken = input.paginationToken;
      const response = await client.get<ListTransportationOptionsResponse>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/shipments/${encodeURIComponent(input.shipmentId)}/transportationOptions`,
        params,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'generate_transportation_options',
    {
      description: 'Generate transportation options for an FBA inbound plan.',
      inputSchema: generateTransportationOptionsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.post<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/transportationOptions`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'confirm_transportation_options',
    {
      description: 'Confirm transportation options for an FBA inbound plan.',
      inputSchema: confirmTransportationOptionsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.post<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/transportationOptions/confirmation`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_prep_details',
    {
      description: 'List prep details for items in an FBA inbound plan.',
      inputSchema: listPrepDetailsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const params: Record<string, unknown> = {};
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.paginationToken) params.paginationToken = input.paginationToken;
      const response = await client.get<ListPrepDetailsResponse>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/items`,
        params,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'set_prep_details',
    {
      description: 'Set prep details for items in an FBA inbound plan.',
      inputSchema: setPrepDetailsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.post<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/prepDetails`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_item_compliance_details',
    {
      description: 'List item compliance details for an FBA inbound plan.',
      inputSchema: listItemComplianceDetailsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const params: Record<string, unknown> = {};
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.paginationToken) params.paginationToken = input.paginationToken;
      const response = await client.get<ListItemComplianceDetailsResponse>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/items`,
        params,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'update_item_compliance_details',
    {
      description: 'Update item compliance details for an FBA inbound plan.',
      inputSchema: updateItemComplianceDetailsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.put<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/itemComplianceDetails`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_shipment_items',
    {
      description: 'List items in a shipment of an FBA inbound plan.',
      inputSchema: listShipmentItemsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const params: Record<string, unknown> = {};
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.paginationToken) params.paginationToken = input.paginationToken;
      const response = await client.get<ListShipmentItemsResponse>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/shipments/${encodeURIComponent(input.shipmentId)}/items`,
        params,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_shipment_boxes',
    {
      description: 'List boxes in a shipment of an FBA inbound plan.',
      inputSchema: listShipmentBoxesSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const params: Record<string, unknown> = {};
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.paginationToken) params.paginationToken = input.paginationToken;
      const response = await client.get<ListShipmentBoxesResponse>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/shipments/${encodeURIComponent(input.shipmentId)}/boxes`,
        params,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_shipment_pallets',
    {
      description: 'List pallets in a shipment of an FBA inbound plan.',
      inputSchema: listShipmentPalletsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const params: Record<string, unknown> = {};
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.paginationToken) params.paginationToken = input.paginationToken;
      const response = await client.get<ListShipmentPalletsResponse>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/shipments/${encodeURIComponent(input.shipmentId)}/pallets`,
        params,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'update_shipment_name',
    {
      description: 'Update the name of a shipment in an FBA inbound plan.',
      inputSchema: updateShipmentNameSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.put<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/shipments/${encodeURIComponent(input.shipmentId)}/name`,
        { name: input.name },
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'update_shipment_source_address',
    {
      description: 'Update the source address of a shipment in an FBA inbound plan.',
      inputSchema: updateShipmentSourceAddressSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.put<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/shipments/${encodeURIComponent(input.shipmentId)}/sourceAddress`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'update_shipment_tracking_details',
    {
      description: 'Update tracking details for a shipment in an FBA inbound plan.',
      inputSchema: updateShipmentTrackingDetailsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.put<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/shipments/${encodeURIComponent(input.shipmentId)}/trackingDetails`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'create_marketplace_item_labels',
    {
      description: 'Create marketplace item labels for FBA inbound.',
      inputSchema: createMarketplaceItemLabelsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);
      const response = await client.post<CreateItemLabelsResponse>(
        '/inbound/fba/2024-03-20/itemLabels',
        { marketplaceId },
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_inbound_operation_status',
    {
      description: 'Get the status of an FBA inbound operation.',
      inputSchema: getInboundOperationStatusSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.get<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/operations/${encodeURIComponent(input.operationId)}`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_delivery_window_options',
    {
      description: 'List delivery window options for a shipment in an FBA inbound plan.',
      inputSchema: listDeliveryWindowOptionsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const params: Record<string, unknown> = {};
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.paginationToken) params.paginationToken = input.paginationToken;
      const response = await client.get<ListDeliveryWindowOptionsResponse>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/shipments/${encodeURIComponent(input.shipmentId)}/deliveryWindowOptions`,
        params,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'generate_delivery_window_options',
    {
      description: 'Generate delivery window options for a shipment in an FBA inbound plan.',
      inputSchema: generateDeliveryWindowOptionsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.post<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/shipments/${encodeURIComponent(input.shipmentId)}/deliveryWindowOptions`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'confirm_delivery_window_options',
    {
      description: 'Confirm a delivery window option for a shipment in an FBA inbound plan.',
      inputSchema: confirmDeliveryWindowOptionsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const response = await client.post<InboundOperationStatus>(
        `/inbound/fba/2024-03-20/inboundPlans/${encodeURIComponent(input.inboundPlanId)}/shipments/${encodeURIComponent(input.shipmentId)}/deliveryWindowOptions/${encodeURIComponent(input.deliveryWindowOptionId)}/confirmation`,
        undefined,
        { rateLimitCategory: 'fbaInbound' }
      );
      return makeToolResponse(response);
    }
  );
}
