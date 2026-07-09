import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../../client/ads-api-client.js';
import { makeToolResponse } from 'amazon-mcp-common';
import type { Target } from '../../types/ads.js';

const listTargetsSchema = z.object({
  stateFilter: z.enum(['ENABLED', 'PAUSED', 'ARCHIVED']).optional().describe('Filter by target state'),
  campaignIdFilter: z.array(z.number()).optional().describe('Filter by campaign IDs'),
  adGroupIdFilter: z.array(z.number()).optional().describe('Filter by ad group IDs'),
  pageSize: z.number().min(1).max(1000).optional().describe('Number of results per page'),
  startIndex: z.number().min(0).optional().describe('Starting index for pagination'),
});

const getTargetSchema = z.object({
  targetId: z.number().describe('The target ID to retrieve'),
});

export function registerSPTargetTools(server: McpServer): void {
  server.registerTool(
    'sp_list_targets',
    {
      description: 'List all Sponsored Products targets. Use filters to narrow results.',
      inputSchema: listTargetsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const params: Record<string, unknown> = {};
        if (input.stateFilter) params.stateFilter = input.stateFilter;
        if (input.campaignIdFilter) params.campaignIdFilter = input.campaignIdFilter.join(',');
        if (input.adGroupIdFilter) params.adGroupIdFilter = input.adGroupIdFilter.join(',');
        if (input.pageSize) params.pageSize = input.pageSize;
        if (input.startIndex !== undefined) params.startIndex = input.startIndex;

        const targets = await client.get<Target[]>(
          '/v2/sp/targets',
          params,
          { rateLimitCategory: 'targets' }
        );

        return makeToolResponse({
          targets: targets.map((t) => ({
            targetId: t.targetId,
            campaignId: t.campaignId,
            adGroupId: t.adGroupId,
            state: t.state,
            expressionType: t.expressionType,
            expression: t.expression,
            bid: t.bid,
          })),
          count: targets.length,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to list SP targets: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_get_target',
    {
      description: 'Get details for a specific Sponsored Products target by ID.',
      inputSchema: getTargetSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const target = await client.get<Target>(
          `/v2/sp/targets/${input.targetId}`,
          undefined,
          { rateLimitCategory: 'targets' }
        );

        return makeToolResponse({
          targetId: target.targetId,
          campaignId: target.campaignId,
          adGroupId: target.adGroupId,
          state: target.state,
          expressionType: target.expressionType,
          expression: target.expression,
          bid: target.bid,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SP target ${input.targetId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
