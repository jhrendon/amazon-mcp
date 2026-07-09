import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn();
const postMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('../src/client/sp-api-client.js', () => ({
  getSPAPIClient: () => ({
    get: getMock,
    post: postMock,
    delete: deleteMock,
  }),
}));

import { registerPricingV0Tools } from '../src/tools/pricing-v0.js';
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

describe('pricing-v0 tools', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    deleteMock.mockReset();
    setParticipatingMarketplaceIds(['ATVPDKIKX0DER']);
  });

  describe('get_pricing', () => {
    it('calls the correct endpoint with ASIN params', async () => {
      getMock.mockResolvedValue({ pricing: [{ ASIN: 'B001', price: { Amount: 19.99 } }] });

      const { server, tools } = makeServer();
      registerPricingV0Tools(server);
      const handler = tools['get_pricing'].handler;

      const result = (await handler({
        marketplaceId: 'ATVPDKIKX0DER',
        itemType: 'Asin',
        asins: ['B001'],
      })) as { structuredContent: { pricing: unknown[] } };

      expect(getMock).toHaveBeenCalledWith(
        '/products/pricing/v0/price',
        expect.objectContaining({
          MarketplaceId: 'ATVPDKIKX0DER',
          ItemType: 'Asin',
          Asins: ['B001'],
        }),
        expect.objectContaining({ rateLimitCategory: 'pricing' })
      );
      expect(result.structuredContent.pricing).toHaveLength(1);
    });

    it('calls the correct endpoint with SKU params', async () => {
      getMock.mockResolvedValue({ pricing: [] });

      const { server, tools } = makeServer();
      registerPricingV0Tools(server);
      const handler = tools['get_pricing'].handler;

      await handler({
        marketplaceId: 'ATVPDKIKX0DER',
        itemType: 'Sku',
        skus: ['MY-SKU-1'],
        itemCondition: 'New',
      });

      expect(getMock).toHaveBeenCalledWith(
        '/products/pricing/v0/price',
        expect.objectContaining({
          MarketplaceId: 'ATVPDKIKX0DER',
          ItemType: 'Sku',
          Skus: ['MY-SKU-1'],
          ItemCondition: 'New',
        }),
        expect.objectContaining({ rateLimitCategory: 'pricing' })
      );
    });
  });

  describe('get_competitive_pricing', () => {
    it('calls the competitivePrice endpoint with ASIN params', async () => {
      getMock.mockResolvedValue({ pricing: [{ ASIN: 'B002', competitivePricing: {} }] });

      const { server, tools } = makeServer();
      registerPricingV0Tools(server);
      const handler = tools['get_competitive_pricing'].handler;

      const result = (await handler({
        marketplaceId: 'ATVPDKIKX0DER',
        itemType: 'Asin',
        asins: ['B002'],
      })) as { structuredContent: { pricing: unknown[] } };

      expect(getMock).toHaveBeenCalledWith(
        '/products/pricing/v0/competitivePrice',
        expect.objectContaining({
          MarketplaceId: 'ATVPDKIKX0DER',
          ItemType: 'Asin',
          Asins: ['B002'],
        }),
        expect.objectContaining({ rateLimitCategory: 'pricing' })
      );
      expect(result.structuredContent.pricing).toHaveLength(1);
    });

    it('passes optional offerType param', async () => {
      getMock.mockResolvedValue({ pricing: [] });

      const { server, tools } = makeServer();
      registerPricingV0Tools(server);
      const handler = tools['get_competitive_pricing'].handler;

      await handler({
        marketplaceId: 'ATVPDKIKX0DER',
        itemType: 'Asin',
        asins: ['B003'],
        offerType: 'B2B',
      });

      expect(getMock).toHaveBeenCalledWith(
        '/products/pricing/v0/competitivePrice',
        expect.objectContaining({ OfferType: 'B2B' }),
        expect.any(Object)
      );
    });
  });

  describe('get_listing_offers', () => {
    it('calls the listings offers endpoint with sellerSKU', async () => {
      const apiResponse = { offers: [{ subCondition: 'New', price: 25.0 }] };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerPricingV0Tools(server);
      const handler = tools['get_listing_offers'].handler;

      const result = (await handler({
        sellerSKU: 'SKU-ABC',
        marketplaceId: 'ATVPDKIKX0DER',
        itemCondition: 'New',
      })) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/products/pricing/v0/listings/SKU-ABC/offers',
        expect.objectContaining({
          MarketplaceId: 'ATVPDKIKX0DER',
          ItemCondition: 'New',
        }),
        expect.objectContaining({ rateLimitCategory: 'pricing' })
      );
      expect(result.structuredContent.offers).toHaveLength(1);
    });

    it('passes customerType when provided', async () => {
      getMock.mockResolvedValue({ offers: [] });

      const { server, tools } = makeServer();
      registerPricingV0Tools(server);
      const handler = tools['get_listing_offers'].handler;

      await handler({
        sellerSKU: 'SKU-XYZ',
        marketplaceId: 'ATVPDKIKX0DER',
        itemCondition: 'Used',
        customerType: 'Business',
      });

      expect(getMock).toHaveBeenCalledWith(
        '/products/pricing/v0/listings/SKU-XYZ/offers',
        expect.objectContaining({ CustomerType: 'Business' }),
        expect.any(Object)
      );
    });
  });

  describe('get_item_offers', () => {
    it('calls the items offers endpoint with ASIN', async () => {
      const apiResponse = { offers: [{ sellerId: 'S1', price: 10.0 }] };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerPricingV0Tools(server);
      const handler = tools['get_item_offers'].handler;

      const result = (await handler({
        asin: 'B00TESTASIN',
        marketplaceId: 'ATVPDKIKX0DER',
        itemCondition: 'New',
      })) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/products/pricing/v0/items/B00TESTASIN/offers',
        expect.objectContaining({
          MarketplaceId: 'ATVPDKIKX0DER',
          ItemCondition: 'New',
        }),
        expect.objectContaining({ rateLimitCategory: 'pricing' })
      );
      expect(result.structuredContent.offers).toHaveLength(1);
    });
  });

  describe('get_item_offers_batch', () => {
    it('posts batch requests to the itemOffers endpoint', async () => {
      const apiResponse = { responses: [{ status: { code: 200 }, body: { offers: [] } }] };
      postMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerPricingV0Tools(server);
      const handler = tools['get_item_offers_batch'].handler;

      const result = (await handler({
        requests: [
          { asin: 'B001', marketplaceId: 'ATVPDKIKX0DER', itemCondition: 'New' },
          { asin: 'B002', marketplaceId: 'ATVPDKIKX0DER', itemCondition: 'New' },
        ],
      })) as { structuredContent: typeof apiResponse };

      expect(postMock).toHaveBeenCalledWith(
        '/batches/products/pricing/v0/itemOffers',
        expect.objectContaining({
          requests: expect.arrayContaining([
            expect.objectContaining({
              Uri: '/products/pricing/v0/items/B001/offers',
              Method: 'GET',
              MarketplaceId: 'ATVPDKIKX0DER',
              ItemCondition: 'New',
            }),
          ]),
        }),
        expect.objectContaining({ rateLimitCategory: 'pricing' })
      );
      expect(result.structuredContent.responses).toHaveLength(1);
    });
  });

  describe('get_listing_offers_batch', () => {
    it('posts batch requests to the listingOffers endpoint', async () => {
      const apiResponse = { responses: [{ status: { code: 200 }, body: { offers: [] } }] };
      postMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerPricingV0Tools(server);
      const handler = tools['get_listing_offers_batch'].handler;

      const result = (await handler({
        requests: [
          { sellerSKU: 'SKU-1', marketplaceId: 'ATVPDKIKX0DER', itemCondition: 'New' },
        ],
      })) as { structuredContent: typeof apiResponse };

      expect(postMock).toHaveBeenCalledWith(
        '/batches/products/pricing/v0/listingOffers',
        expect.objectContaining({
          requests: expect.arrayContaining([
            expect.objectContaining({
              Uri: '/products/pricing/v0/listings/SKU-1/offers',
              Method: 'GET',
              MarketplaceId: 'ATVPDKIKX0DER',
              ItemCondition: 'New',
            }),
          ]),
        }),
        expect.objectContaining({ rateLimitCategory: 'pricing' })
      );
      expect(result.structuredContent.responses).toHaveLength(1);
    });

    it('includes customerType in batch requests when provided', async () => {
      postMock.mockResolvedValue({ responses: [] });

      const { server, tools } = makeServer();
      registerPricingV0Tools(server);
      const handler = tools['get_listing_offers_batch'].handler;

      await handler({
        requests: [
          { sellerSKU: 'SKU-2', marketplaceId: 'ATVPDKIKX0DER', itemCondition: 'Used', customerType: 'Consumer' },
        ],
      });

      expect(postMock).toHaveBeenCalledWith(
        '/batches/products/pricing/v0/listingOffers',
        expect.objectContaining({
          requests: expect.arrayContaining([
            expect.objectContaining({ CustomerType: 'Consumer' }),
          ]),
        }),
        expect.any(Object)
      );
    });
  });
});
