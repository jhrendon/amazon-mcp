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

import { registerSellersTools } from '../src/tools/sellers.js';
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

describe('sellers tools', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    deleteMock.mockReset();
    setParticipatingMarketplaceIds(['ATVPDKIKX0DER']);
  });

  describe('get_marketplace_participations', () => {
    it('calls the correct endpoint with no params', async () => {
      const apiResponse = {
        payload: [
          { marketplaceId: 'ATVPDKIKX0DER', status: { accountStatus: 'ACTIVE', listingStatus: 'ACTIVE' } },
        ],
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerSellersTools(server);
      const handler = tools['get_marketplace_participations'].handler;

      const result = (await handler({})) as { structuredContent: unknown[] };

      expect(getMock).toHaveBeenCalledWith(
        '/sellers/v1/marketplaceParticipations',
        {},
        expect.objectContaining({ rateLimitCategory: 'sellers' })
      );
      expect(result.structuredContent).toHaveLength(1);
    });
  });

  describe('get_account', () => {
    it('calls the correct endpoint and returns account info', async () => {
      const apiResponse = {
        payload: { businessName: 'Test Store', businessAddress: { districtOrCounty: 'US' } },
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerSellersTools(server);
      const handler = tools['get_account'].handler;

      const result = (await handler({})) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/sellers/v1/account',
        {},
        expect.objectContaining({ rateLimitCategory: 'sellers' })
      );
      expect(result.structuredContent.payload.businessName).toBe('Test Store');
    });

    it('returns empty payload when response is undefined', async () => {
      getMock.mockResolvedValue(undefined);

      const { server, tools } = makeServer();
      registerSellersTools(server);
      const handler = tools['get_account'].handler;

      const result = (await handler({})) as { structuredContent: unknown };

      expect(result.structuredContent).toBeUndefined();
    });
  });
});
