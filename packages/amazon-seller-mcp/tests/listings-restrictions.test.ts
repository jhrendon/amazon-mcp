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

import { registerListingsRestrictionsTools } from '../src/tools/listings-restrictions.js';
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

describe('listings-restrictions tools', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    deleteMock.mockReset();
    setParticipatingMarketplaceIds(['ATVPDKIKX0DER']);
  });

  describe('get_listings_restrictions', () => {
    it('calls the correct endpoint with required params', async () => {
      const apiResponse = { restrictions: [] };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerListingsRestrictionsTools(server);
      const handler = tools['get_listings_restrictions'].handler;

      const result = (await handler({
        asin: 'B00TESTASIN',
        sellerId: 'SELLER123',
        marketplaceIds: ['ATVPDKIKX0DER'],
      })) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/listings/2021-08-01/restrictions',
        expect.objectContaining({
          asin: 'B00TESTASIN',
          sellerId: 'SELLER123',
          marketplaceIds: 'ATVPDKIKX0DER',
        }),
        expect.objectContaining({ rateLimitCategory: 'listingsRestrictions' })
      );
      expect(result.structuredContent.restrictions).toHaveLength(0);
    });

    it('passes optional conditionType and reasonLocale params', async () => {
      const apiResponse = { restrictions: [{ restrictionType: 'APPROVAL_REQUIRED', reason: 'Gated category' }] };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerListingsRestrictionsTools(server);
      const handler = tools['get_listings_restrictions'].handler;

      const result = (await handler({
        asin: 'B00GATED',
        sellerId: 'SELLER456',
        marketplaceIds: ['ATVPDKIKX0DER'],
        conditionType: 'new_new',
        reasonLocale: 'en_US',
      })) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/listings/2021-08-01/restrictions',
        expect.objectContaining({
          conditionType: 'new_new',
          reasonLocale: 'en_US',
        }),
        expect.any(Object)
      );
      expect(result.structuredContent.restrictions).toHaveLength(1);
    });
  });
});
