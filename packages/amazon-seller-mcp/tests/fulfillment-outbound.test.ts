import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();

vi.mock('../src/client/sp-api-client.js', () => ({
  getSPAPIClient: () => ({
    get: getMock,
    post: postMock,
    put: putMock,
  }),
}));

import { registerFulfillmentOutboundTools } from '../src/tools/fulfillment-outbound.js';
import { setParticipatingMarketplaceIds } from '../src/tools/_shared/marketplace.js';

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

const baseAddress = {
  line1: '123 Main St',
  city: 'Austin',
  stateOrRegion: 'TX',
  postalCode: '78701',
  countryCode: 'US',
};

describe('fulfillment outbound tools', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    setParticipatingMarketplaceIds(['ATVPDKIKX0DER']);
  });

  describe('get_fulfillment_preview', () => {
    it('posts preview request and returns response', async () => {
      const apiResponse = {
        fulfillmentPreviewShipments: [
          { earliestArrivalDate: '2025-02-01', latestArrivalDate: '2025-02-05' },
        ],
      };
      postMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['get_fulfillment_preview'].handler;

      const result = (await handler({
        marketplaceId: 'ATVPDKIKX0DER',
        address: baseAddress,
        items: [{ sellerSku: 'SKU-1', quantity: 3 }],
        shippingSpeedCategories: ['Standard'],
      })) as { structuredContent: typeof apiResponse };

      expect(postMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/fulfillmentOrders/preview',
        expect.objectContaining({
          address: expect.objectContaining({ line1: '123 Main St', countryCode: 'US' }),
          items: [{ sellerSku: 'SKU-1', quantity: 3 }],
          shippingSpeedCategories: ['Standard'],
        }),
        expect.objectContaining({ rateLimitCategory: 'fulfillmentOutbound' })
      );
      expect(result.structuredContent.fulfillmentPreviewShipments).toHaveLength(1);
    });

    it('omits shippingSpeedCategories when not provided', async () => {
      postMock.mockResolvedValue({ fulfillmentPreviewShipments: [] });

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['get_fulfillment_preview'].handler;

      await handler({ marketplaceId: 'ATVPDKIKX0DER', address: baseAddress, items: [{ sellerSku: 'SKU-1', quantity: 1 }] });

      const body = postMock.mock.calls[0][1];
      expect(body).not.toHaveProperty('shippingSpeedCategories');
    });
  });

  describe('list_fulfillment_orders', () => {
    it('returns fulfillment orders with queryStartDate', async () => {
      const apiResponse = {
        fulfillmentOrders: [
          { sellerFulfillmentOrderId: 'FO-1', status: 'PROCESSING' },
        ],
        nextToken: 'tok-abc',
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['list_fulfillment_orders'].handler;

      const result = (await handler({ queryStartDate: '2025-01-01T00:00:00Z' })) as {
        structuredContent: typeof apiResponse;
      };

      expect(getMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/fulfillmentOrders',
        expect.objectContaining({ queryStartDate: '2025-01-01T00:00:00Z' }),
        expect.objectContaining({ rateLimitCategory: 'fulfillmentOutbound' })
      );
      expect(result.structuredContent.fulfillmentOrders).toHaveLength(1);
      expect(result.structuredContent.nextToken).toBe('tok-abc');
    });

    it('passes nextToken when provided', async () => {
      getMock.mockResolvedValue({ fulfillmentOrders: [] });

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['list_fulfillment_orders'].handler;

      await handler({ queryStartDate: '2025-01-01T00:00:00Z', nextToken: 'page-2' });

      expect(getMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/fulfillmentOrders',
        expect.objectContaining({ queryStartDate: '2025-01-01T00:00:00Z', nextToken: 'page-2' }),
        expect.any(Object)
      );
    });
  });

  describe('create_fulfillment_order', () => {
    it('creates a fulfillment order with transformed body', async () => {
      postMock.mockResolvedValue({});

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['create_fulfillment_order'].handler;

      const result = (await handler({
        marketplaceId: 'ATVPDKIKX0DER',
        sellerFulfillmentOrderId: 'FO-100',
        displayableOrderId: 'Order-100',
        displayableOrderDate: '2025-01-15',
        displayableOrderComment: 'Gift wrap please',
        shippingSpeedCategory: 'Expedited',
        destinationAddress: baseAddress,
        items: [
          {
            sellerSku: 'SKU-1',
            quantity: 2,
            perUnitDeclaredValue: { currencyCode: 'USD', value: '19.99' },
          },
        ],
      })) as { structuredContent: Record<string, unknown> };

      expect(postMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/fulfillmentOrders',
        expect.objectContaining({
          sellerFulfillmentOrderId: 'FO-100',
          displayableOrderId: 'Order-100',
          displayableOrderDate: '2025-01-15',
          displayableOrderComment: 'Gift wrap please',
          shippingSpeedCategory: 'Expedited',
          destinationAddress: expect.objectContaining({ line1: '123 Main St' }),
          items: expect.arrayContaining([
            expect.objectContaining({
              sellerSku: 'SKU-1',
              quantity: 2,
              perUnitDeclaredValue: { CurrencyCode: 'USD', Amount: '19.99' },
            }),
          ]),
        }),
        expect.objectContaining({ rateLimitCategory: 'fulfillmentOutbound' })
      );
      expect(result.structuredContent).toEqual({});
    });

    it('rejects missing required fields via zod', () => {
      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const schema = tools['create_fulfillment_order'].schema as { parse: (v: unknown) => unknown };
      expect(() =>
        schema.parse({
          sellerFulfillmentOrderId: 'FO-100',
        })
      ).toThrow();
    });

    it('rejects empty items array via zod', () => {
      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const schema = tools['create_fulfillment_order'].schema as { parse: (v: unknown) => unknown };
      expect(() =>
        schema.parse({
          sellerFulfillmentOrderId: 'FO-100',
          displayableOrderId: 'Order-100',
          displayableOrderDate: '2025-01-15',
          shippingSpeedCategory: 'Standard',
          destinationAddress: baseAddress,
          items: [],
        })
      ).toThrow();
    });
  });

  describe('get_fulfillment_order', () => {
    it('returns order details by sellerFulfillmentOrderId', async () => {
      const apiResponse = {
        fulfillmentOrder: { sellerFulfillmentOrderId: 'FO-1', status: 'COMPLETE' },
        fulfillmentOrderItems: [{ sellerSku: 'SKU-1', quantity: 2 }],
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['get_fulfillment_order'].handler;

      const result = (await handler({ sellerFulfillmentOrderId: 'FO-1' })) as {
        structuredContent: typeof apiResponse;
      };

      expect(getMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/fulfillmentOrders/FO-1',
        undefined,
        expect.objectContaining({ rateLimitCategory: 'fulfillmentOutbound' })
      );
      expect(result.structuredContent.fulfillmentOrder.sellerFulfillmentOrderId).toBe('FO-1');
    });
  });

  describe('update_fulfillment_order', () => {
    it('puts updated fields to the order endpoint', async () => {
      putMock.mockResolvedValue({});

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['update_fulfillment_order'].handler;

      const result = (await handler({
        sellerFulfillmentOrderId: 'FO-1',
        shippingSpeedCategory: 'Priority',
        destinationAddress: { ...baseAddress, line1: '456 Oak Ave' },
      })) as { structuredContent: Record<string, unknown> };

      expect(putMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/fulfillmentOrders/FO-1',
        expect.objectContaining({
          shippingSpeedCategory: 'Priority',
          destinationAddress: expect.objectContaining({ line1: '456 Oak Ave' }),
        }),
        expect.objectContaining({ rateLimitCategory: 'fulfillmentOutbound' })
      );
      expect(result.structuredContent).toEqual({});
    });

    it('omits optional fields when not provided', async () => {
      putMock.mockResolvedValue({});

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['update_fulfillment_order'].handler;

      await handler({ sellerFulfillmentOrderId: 'FO-1' });

      expect(putMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/fulfillmentOrders/FO-1',
        {},
        expect.any(Object)
      );
    });
  });

  describe('cancel_fulfillment_order', () => {
    it('puts to the cancel endpoint', async () => {
      putMock.mockResolvedValue({});

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['cancel_fulfillment_order'].handler;

      const result = (await handler({ sellerFulfillmentOrderId: 'FO-1' })) as {
        structuredContent: Record<string, unknown>;
      };

      expect(putMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/fulfillmentOrders/FO-1/cancel',
        undefined,
        expect.objectContaining({ rateLimitCategory: 'fulfillmentOutbound' })
      );
      expect(result.structuredContent).toEqual({});
    });
  });

  describe('get_package_tracking_details', () => {
    it('returns tracking details for a package', async () => {
      const apiResponse = {
        packageNumber: 1,
        trackingNumber: '1Z999AA10123456784',
        carrierCode: 'UPS',
        currentStatus: 'DELIVERED',
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['get_package_tracking_details'].handler;

      const result = (await handler({ packageTrackingId: '1Z999AA10123456784' })) as {
        structuredContent: typeof apiResponse;
      };

      expect(getMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/tracking',
        expect.objectContaining({ packageTrackingId: '1Z999AA10123456784' }),
        expect.objectContaining({ rateLimitCategory: 'fulfillmentOutbound' })
      );
      expect(result.structuredContent.currentStatus).toBe('DELIVERED');
    });
  });

  describe('list_return_reason_codes', () => {
    it('returns return reason codes with marketplaceId', async () => {
      const apiResponse = {
        reasonCodeDetailsList: [
          { returnReasonCode: 'CUSTOMER_RETURN', description: 'Customer returned item' },
        ],
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['list_return_reason_codes'].handler;

      const result = (await handler({ marketplaceId: 'ATVPDKIKX0DER', sellerSku: 'SKU-1' })) as {
        structuredContent: typeof apiResponse;
      };

      expect(getMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/returnReasonCodes',
        expect.objectContaining({ sellerSku: 'SKU-1', marketplaceId: 'ATVPDKIKX0DER' }),
        expect.objectContaining({ rateLimitCategory: 'fulfillmentOutbound' })
      );
      expect(result.structuredContent.reasonCodeDetailsList).toHaveLength(1);
    });

    it('includes sellerFulfillmentOrderId when provided', async () => {
      getMock.mockResolvedValue({ reasonCodeDetailsList: [] });

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['list_return_reason_codes'].handler;

      await handler({ marketplaceId: 'ATVPDKIKX0DER', sellerSku: 'SKU-1', sellerFulfillmentOrderId: 'FO-1' });

      expect(getMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/returnReasonCodes',
        expect.objectContaining({ sellerSku: 'SKU-1', sellerFulfillmentOrderId: 'FO-1' }),
        expect.any(Object)
      );
    });
  });

  describe('create_fulfillment_return', () => {
    it('puts return items to the return endpoint', async () => {
      const apiResponse = { returnItems: [{ sellerReturnItemId: 'RI-1' }] };
      putMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['create_fulfillment_return'].handler;

      const result = (await handler({
        sellerFulfillmentOrderId: 'FO-1',
        items: [
          {
            sellerReturnItemId: 'RI-1',
            sellerFulfillmentOrderItemId: 'FOI-1',
            amazonShipmentId: 'SHIP-1',
            returnReasonCode: 'CUSTOMER_RETURN',
            returnComment: 'Defective',
          },
        ],
      })) as { structuredContent: typeof apiResponse };

      expect(putMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/fulfillmentOrders/FO-1/return',
        expect.objectContaining({
          items: [
            expect.objectContaining({
              sellerReturnItemId: 'RI-1',
              sellerFulfillmentOrderItemId: 'FOI-1',
              amazonShipmentId: 'SHIP-1',
              returnReasonCode: 'CUSTOMER_RETURN',
              returnComment: 'Defective',
            }),
          ],
        }),
        expect.objectContaining({ rateLimitCategory: 'fulfillmentOutbound' })
      );
      expect(result.structuredContent.returnItems).toHaveLength(1);
    });

    it('includes returnId when provided', async () => {
      putMock.mockResolvedValue({});

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['create_fulfillment_return'].handler;

      await handler({
        sellerFulfillmentOrderId: 'FO-1',
        items: [
          {
            sellerReturnItemId: 'RI-1',
            sellerFulfillmentOrderItemId: 'FOI-1',
            amazonShipmentId: 'SHIP-1',
            returnReasonCode: 'CUSTOMER_RETURN',
          },
        ],
        returnId: 'RET-99',
      });

      expect(putMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/fulfillmentOrders/FO-1/return',
        expect.objectContaining({ returnId: 'RET-99' }),
        expect.any(Object)
      );
    });
  });

  describe('get_features', () => {
    it('returns available features with marketplaceId', async () => {
      const apiResponse = {
        features: [
          { featureName: 'BLANK_BOX', featureState: 'ENABLED' },
          { featureName: 'BRANDED_BOX', featureState: 'DISABLED' },
        ],
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['get_features'].handler;

      const result = (await handler({ marketplaceId: 'ATVPDKIKX0DER' })) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/features',
        expect.objectContaining({ marketplaceId: 'ATVPDKIKX0DER' }),
        expect.objectContaining({ rateLimitCategory: 'fulfillmentOutbound' })
      );
      expect(result.structuredContent.features).toHaveLength(2);
    });
  });

  describe('get_feature_inventory', () => {
    it('returns inventory for a feature', async () => {
      const apiResponse = {
        featureName: 'BLANK_BOX',
        featureSkus: [{ sellerSku: 'SKU-1', featureInventoryStatus: 'AVAILABLE' }],
        nextToken: 'tok-feat',
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['get_feature_inventory'].handler;

      const result = (await handler({ featureName: 'BLANK_BOX', marketplaceId: 'ATVPDKIKX0DER' })) as {
        structuredContent: typeof apiResponse;
      };

      expect(getMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/features/inventory/BLANK_BOX',
        expect.objectContaining({ marketplaceId: 'ATVPDKIKX0DER' }),
        expect.objectContaining({ rateLimitCategory: 'fulfillmentOutbound' })
      );
      expect(result.structuredContent.featureSkus).toHaveLength(1);
      expect(result.structuredContent.nextToken).toBe('tok-feat');
    });

    it('passes nextToken when provided', async () => {
      getMock.mockResolvedValue({ featureName: 'BLANK_BOX', featureSkus: [] });

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['get_feature_inventory'].handler;

      await handler({ featureName: 'BLANK_BOX', marketplaceId: 'ATVPDKIKX0DER', nextToken: 'page-2' });

      expect(getMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/features/inventory/BLANK_BOX',
        expect.objectContaining({ marketplaceId: 'ATVPDKIKX0DER', nextToken: 'page-2' }),
        expect.any(Object)
      );
    });
  });

  describe('get_feature_sku', () => {
    it('returns feature eligibility for a SKU', async () => {
      const apiResponse = {
        marketplaceId: 'ATVPDKIKX0DER',
        featureName: 'BLANK_BOX',
        isEligible: true,
        featureEligibilities: [{ fulfillmentFeature: 'BLANK_BOX', isEligible: true }],
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFulfillmentOutboundTools(server);
      const handler = tools['get_feature_sku'].handler;

      const result = (await handler({ featureName: 'BLANK_BOX', sellerSku: 'SKU-1', marketplaceId: 'ATVPDKIKX0DER' })) as {
        structuredContent: typeof apiResponse;
      };

      expect(getMock).toHaveBeenCalledWith(
        '/fba/outbound/2020-07-01/features/inventory/BLANK_BOX/SKU-1',
        expect.objectContaining({ marketplaceId: 'ATVPDKIKX0DER' }),
        expect.objectContaining({ rateLimitCategory: 'fulfillmentOutbound' })
      );
      expect(result.structuredContent.isEligible).toBe(true);
    });
  });
});
