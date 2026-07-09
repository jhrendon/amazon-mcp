import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../client/ads-api-client.js';
import { makeToolResponse } from 'amazon-mcp-common';

const budgetSchema = z.object({
  amount: z.number().optional().describe('Budget amount'),
  currencyCode: z.string().optional().describe('Currency code (e.g., USD)'),
  policy: z.string().optional().describe('Budget policy'),
  startDate: z.string().optional().describe('Budget start date'),
  endDate: z.string().optional().describe('Budget end date'),
});

const listPortfoliosSchema = z.object({
  portfolioIdFilter: z.array(z.number()).optional().describe('Filter by portfolio IDs'),
  portfolioNameFilter: z.array(z.string()).optional().describe('Filter by portfolio names'),
  portfolioStateFilter: z.enum(['enabled', 'paused', 'archived']).optional().describe('Filter by portfolio state'),
});

const getPortfolioSchema = z.object({
  portfolioId: z.number().describe('Portfolio ID'),
});

const createPortfolioItemSchema = z.object({
  name: z.string().min(1).describe('Portfolio name'),
  budget: budgetSchema.optional().describe('Portfolio budget'),
  state: z.enum(['enabled', 'paused']).optional().describe('Portfolio state'),
});

const createPortfoliosSchema = z.object({
  portfolios: z.array(createPortfolioItemSchema).min(1).describe('Portfolios to create'),
});

const updatePortfolioItemSchema = z.object({
  portfolioId: z.number().describe('Portfolio ID'),
  name: z.string().optional().describe('New portfolio name'),
  budget: budgetSchema.optional().describe('New portfolio budget'),
  state: z.enum(['enabled', 'paused', 'archived']).optional().describe('New portfolio state'),
});

const updatePortfoliosSchema = z.object({
  portfolios: z.array(updatePortfolioItemSchema).min(1).describe('Portfolios to update'),
});

const getPortfolioExtendedSchema = z.object({
  portfolioId: z.number().describe('Portfolio ID'),
});

export function registerPortfolioTools(server: McpServer): void {
  server.registerTool(
    'list_portfolios',
    {
      description: 'List all portfolios. Use filters to narrow results.',
      inputSchema: listPortfoliosSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const params: Record<string, unknown> = {};
        if (input.portfolioIdFilter) params.portfolioIdFilter = input.portfolioIdFilter.join(',');
        if (input.portfolioNameFilter) params.portfolioNameFilter = input.portfolioNameFilter.join(',');
        if (input.portfolioStateFilter) params.portfolioStateFilter = input.portfolioStateFilter;

        const result = await client.get<Record<string, unknown>[]>(
          '/v2/portfolios',
          Object.keys(params).length > 0 ? params : undefined,
          { rateLimitCategory: 'portfolios' }
        );
        const portfolios = Array.isArray(result) ? result : [];
        return makeToolResponse({
          portfolios,
          count: portfolios.length,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to list portfolios: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'get_portfolio',
    {
      description: 'Get details for a specific portfolio by ID.',
      inputSchema: getPortfolioSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const result = await client.get<Record<string, unknown>>(
          `/v2/portfolios/${input.portfolioId}`,
          undefined,
          { rateLimitCategory: 'portfolios' }
        );
        return makeToolResponse(result);
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get portfolio ${input.portfolioId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'create_portfolios',
    {
      description: 'Create one or more new portfolios.',
      inputSchema: createPortfoliosSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const result = await client.post<Record<string, unknown>[]>(
          '/v2/portfolios',
          input.portfolios,
          { rateLimitCategory: 'portfolios' }
        );
        return makeToolResponse({
          portfolios: result,
          count: Array.isArray(result) ? result.length : 0,
          message: `Created ${Array.isArray(result) ? result.length : 0} portfolio(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to create portfolios: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'update_portfolios',
    {
      description: 'Update one or more existing portfolios.',
      inputSchema: updatePortfoliosSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const result = await client.put<Record<string, unknown>[]>(
          '/v2/portfolios',
          input.portfolios,
          { rateLimitCategory: 'portfolios' }
        );
        return makeToolResponse({
          portfolios: result,
          count: Array.isArray(result) ? result.length : 0,
          message: `Updated ${Array.isArray(result) ? result.length : 0} portfolio(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to update portfolios: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'get_portfolio_extended',
    {
      description: 'Get extended details for a specific portfolio by ID, including additional metrics.',
      inputSchema: getPortfolioExtendedSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const result = await client.get<Record<string, unknown>>(
          `/v2/portfolios/extended/${input.portfolioId}`,
          undefined,
          { rateLimitCategory: 'portfolios' }
        );
        return makeToolResponse(result);
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get extended portfolio ${input.portfolioId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
