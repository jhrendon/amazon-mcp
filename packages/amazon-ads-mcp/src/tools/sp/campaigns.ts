import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../../client/ads-api-client.js';
import { makeToolResponse } from 'amazon-mcp-common';
import type { Campaign } from '../../types/ads.js';

const listCampaignsSchema = z.object({
  stateFilter: z.enum(['ENABLED', 'PAUSED', 'ARCHIVED']).optional().describe('Filter by campaign state'),
  campaignIdFilter: z.array(z.number()).optional().describe('Filter by specific campaign IDs'),
  pageSize: z.number().min(1).max(1000).optional().describe('Number of results per page'),
  startIndex: z.number().min(0).optional().describe('Starting index for pagination'),
});

const getCampaignSchema = z.object({
  campaignId: z.number().describe('The campaign ID to retrieve'),
});

export function registerSPCampaignTools(server: McpServer): void {
  server.registerTool(
    'sp_list_campaigns',
    {
      description: 'List all Sponsored Products campaigns. Use stateFilter to filter by status (ENABLED, PAUSED, ARCHIVED).',
      inputSchema: listCampaignsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const params: Record<string, unknown> = {};
        if (input.stateFilter) params.stateFilter = input.stateFilter;
        if (input.campaignIdFilter) params.campaignIdFilter = input.campaignIdFilter.join(',');
        if (input.pageSize) params.pageSize = input.pageSize;
        if (input.startIndex !== undefined) params.startIndex = input.startIndex;

        const campaigns = await client.get<Campaign[]>(
          '/v2/sp/campaigns',
          params,
          { rateLimitCategory: 'campaigns' }
        );

        return makeToolResponse({
          campaigns: campaigns.map((c) => ({
            campaignId: c.campaignId,
            name: c.name,
            campaignType: c.campaignType,
            targetingType: c.targetingType,
            state: c.state,
            dailyBudget: c.dailyBudget,
            startDate: c.startDate,
            endDate: c.endDate,
            bidding: c.bidding,
          })),
          count: campaigns.length,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to list SP campaigns: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_get_campaign',
    {
      description: 'Get details for a specific Sponsored Products campaign by ID.',
      inputSchema: getCampaignSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const campaign = await client.get<Campaign>(
          `/v2/sp/campaigns/${input.campaignId}`,
          undefined,
          { rateLimitCategory: 'campaigns' }
        );

        return makeToolResponse({
          campaignId: campaign.campaignId,
          name: campaign.name,
          campaignType: campaign.campaignType,
          targetingType: campaign.targetingType,
          state: campaign.state,
          dailyBudget: campaign.dailyBudget,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          bidding: campaign.bidding,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SP campaign ${input.campaignId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
