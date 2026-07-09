import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSPAPIClient } from '../client/sp-api-client.js';
import { makeToolResponse } from './_shared/response.js';
import type { GetMarketplaceParticipationsResponse } from '../types/sp-api.js';

export function registerSellersTools(server: McpServer): void {
  server.registerTool(
    'get_marketplace_participations',
    {
      description:
        'Get the list of marketplaces the seller is participating in, along with their participation status. Shows which marketplaces are available and whether listings are active or suspended.',
      inputSchema: z.object({}),
    },
    async () => {
      const client = getSPAPIClient();

      const response = await client.get<GetMarketplaceParticipationsResponse>(
        '/sellers/v1/marketplaceParticipations',
        {},
        { rateLimitCategory: 'sellers' }
      );

      return makeToolResponse(response?.payload ?? []);
    }
  );

  server.registerTool(
    'get_account',
    {
      description:
        'Get the seller account information including business name, address, and other account details.',
      inputSchema: z.object({}),
    },
    async () => {
      const client = getSPAPIClient();

      const response = await client.get(
        '/sellers/v1/account',
        {},
        { rateLimitCategory: 'sellers' }
      );

      return makeToolResponse(response);
    }
  );
}
