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

import { registerProductTypeDefinitionTools } from '../src/tools/product-type-definitions.js';
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

describe('product-type-definitions tools', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    deleteMock.mockReset();
    setParticipatingMarketplaceIds(['ATVPDKIKX0DER']);
  });

  describe('search_product_type_definitions', () => {
    it('calls the correct endpoint with marketplaceIds', async () => {
      const apiResponse = { productTypes: [{ name: 'LUGGAGE', displayName: 'Luggage' }] };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerProductTypeDefinitionTools(server);
      const handler = tools['search_product_type_definitions'].handler;

      const result = (await handler({
        marketplaceIds: ['ATVPDKIKX0DER'],
        keywords: ['suitcase', 'travel'],
      })) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/definitions/2020-09-01/productTypes',
        expect.objectContaining({
          marketplaceIds: 'ATVPDKIKX0DER',
          keywords: 'suitcase,travel',
        }),
        expect.objectContaining({ rateLimitCategory: 'productTypeDefinitions' })
      );
      expect(result.structuredContent.productTypes).toHaveLength(1);
    });

    it('passes optional params when provided', async () => {
      getMock.mockResolvedValue({ productTypes: [] });

      const { server, tools } = makeServer();
      registerProductTypeDefinitionTools(server);
      const handler = tools['search_product_type_definitions'].handler;

      await handler({
        marketplaceIds: ['ATVPDKIKX0DER'],
        itemName: 'Backpack',
        locale: 'en_US',
        searchLocale: ['en_US', 'es_US'],
      });

      expect(getMock).toHaveBeenCalledWith(
        '/definitions/2020-09-01/productTypes',
        expect.objectContaining({
          itemName: 'Backpack',
          locale: 'en_US',
          searchLocale: 'en_US,es_US',
        }),
        expect.any(Object)
      );
    });
  });

  describe('get_product_type_definition', () => {
    it('calls the correct endpoint with productType in path', async () => {
      const apiResponse = { productType: 'LUGGAGE', attributes: [{ name: 'color' }] };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerProductTypeDefinitionTools(server);
      const handler = tools['get_product_type_definition'].handler;

      const result = (await handler({
        productType: 'LUGGAGE',
        marketplaceIds: ['ATVPDKIKX0DER'],
      })) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/definitions/2020-09-01/productTypes/LUGGAGE',
        expect.objectContaining({
          marketplaceIds: 'ATVPDKIKX0DER',
        }),
        expect.objectContaining({ rateLimitCategory: 'productTypeDefinitions' })
      );
      expect(result.structuredContent.productType).toBe('LUGGAGE');
    });

    it('passes optional requirements and useCase params', async () => {
      getMock.mockResolvedValue({ productType: 'TOY' });

      const { server, tools } = makeServer();
      registerProductTypeDefinitionTools(server);
      const handler = tools['get_product_type_definition'].handler;

      await handler({
        productType: 'TOY',
        marketplaceIds: ['ATVPDKIKX0DER'],
        requirements: 'LISTING',
        requirementsEnforced: 'ENFORCED',
        useCase: 'CREATE',
        sellerId: 'SELLER123',
        locale: 'en_US',
      });

      expect(getMock).toHaveBeenCalledWith(
        '/definitions/2020-09-01/productTypes/TOY',
        expect.objectContaining({
          requirements: 'LISTING',
          requirementsEnforced: 'ENFORCED',
          useCase: 'CREATE',
          sellerId: 'SELLER123',
          locale: 'en_US',
        }),
        expect.any(Object)
      );
    });
  });
});
