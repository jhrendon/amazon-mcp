import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../../client/ads-api-client.js';
import { makeToolResponse } from 'amazon-mcp-common';
import type { AdGroup } from '../../types/ads.js';

const listAdGroupsSchema = z.object({
  stateFilter: z.enum(['ENABLED', 'PAUSED', 'ARCHIVED']).optional().describe('Filter by ad group state'),
  campaignIdFilter: z.array(z.number()).optional().describe('Filter by campaign IDs'),
  adGroupIdFilter: z.array(z.number()).optional().describe('Filter by ad group IDs'),
  pageSize: z.number().min(1).max(1000).optional().describe('Number of results per page'),
  startIndex: z.number().min(0).optional().describe('Starting index for pagination'),
});

const getAdGroupSchema = z.object({
  adGroupId: z.number().describe('The ad group ID to retrieve'),
});

export function registerSPAdGroupTools(server: McpServer): void {
  server.registerTool(
    'sp_list_ad_groups',
    {
      description: 'List all Sponsored Products ad groups. Use filters to narrow results.',
      inputSchema: listAdGroupsSchema,
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

        const adGroups = await client.get<AdGroup[]>(
          '/v2/sp/adGroups',
          params,
          { rateLimitCategory: 'adGroups' }
        );

        return makeToolResponse({
          adGroups: adGroups.map((ag) => ({
            adGroupId: ag.adGroupId,
            campaignId: ag.campaignId,
            name: ag.name,
            defaultBid: ag.defaultBid,
            state: ag.state,
          })),
          count: adGroups.length,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to list SP ad groups: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_get_ad_group',
    {
      description: 'Get details for a specific Sponsored Products ad group by ID.',
      inputSchema: getAdGroupSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const adGroup = await client.get<AdGroup>(
          `/v2/sp/adGroups/${input.adGroupId}`,
          undefined,
          { rateLimitCategory: 'adGroups' }
        );

        return makeToolResponse({
          adGroupId: adGroup.adGroupId,
          campaignId: adGroup.campaignId,
          name: adGroup.name,
          defaultBid: adGroup.defaultBid,
          state: adGroup.state,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SP ad group ${input.adGroupId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
