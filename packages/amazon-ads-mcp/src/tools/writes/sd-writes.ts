import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../../client/ads-api-client.js';
import { makeToolResponse } from 'amazon-mcp-common';
import type { Campaign, AdGroup } from '../../types/ads.js';

const updateCampaignSchema = z.object({
  campaignId: z.number().describe('Campaign ID to update'),
  name: z.string().optional().describe('New campaign name'),
  state: z.enum(['ENABLED', 'PAUSED', 'ARCHIVED']).optional().describe('New campaign state'),
  dailyBudget: z.number().positive().optional().describe('New daily budget amount'),
});

const updateAdGroupSchema = z.object({
  adGroupId: z.number().describe('Ad group ID to update'),
  name: z.string().optional().describe('New ad group name'),
  state: z.enum(['ENABLED', 'PAUSED', 'ARCHIVED']).optional().describe('New ad group state'),
  defaultBid: z.number().positive().optional().describe('New default bid amount'),
});

export function registerSDWriteTools(server: McpServer): void {
  server.registerTool(
    'sd_update_campaign',
    {
      description: 'Update a Sponsored Display campaign. Can change name, state, and daily budget.',
      inputSchema: updateCampaignSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const updateData: Partial<Campaign> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.state !== undefined) updateData.state = input.state;
        if (input.dailyBudget !== undefined) updateData.dailyBudget = input.dailyBudget;

        const updated = await client.put<Campaign>(
          `/sd/campaigns`,
          [{ ...updateData, campaignId: input.campaignId }],
          { rateLimitCategory: 'campaigns' }
        );

        const result = Array.isArray(updated) ? updated[0] : updated;

        return makeToolResponse({
          campaignId: result.campaignId,
          name: result.name,
          state: result.state,
          dailyBudget: result.dailyBudget,
          message: 'Campaign updated successfully',
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to update SD campaign: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sd_pause_campaign',
    {
      description: 'Pause a Sponsored Display campaign.',
      inputSchema: z.object({
        campaignId: z.number().describe('Campaign ID to pause'),
      }),
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const updated = await client.put<Campaign>(
          `/sd/campaigns`,
          [{ campaignId: input.campaignId, state: 'PAUSED' }],
          { rateLimitCategory: 'campaigns' }
        );

        const result = Array.isArray(updated) ? updated[0] : updated;

        return makeToolResponse({
          campaignId: result.campaignId,
          name: result.name,
          state: result.state,
          message: 'Campaign paused successfully',
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to pause SD campaign: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sd_enable_campaign',
    {
      description: 'Enable a Sponsored Display campaign.',
      inputSchema: z.object({
        campaignId: z.number().describe('Campaign ID to enable'),
      }),
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const updated = await client.put<Campaign>(
          `/sd/campaigns`,
          [{ campaignId: input.campaignId, state: 'ENABLED' }],
          { rateLimitCategory: 'campaigns' }
        );

        const result = Array.isArray(updated) ? updated[0] : updated;

        return makeToolResponse({
          campaignId: result.campaignId,
          name: result.name,
          state: result.state,
          message: 'Campaign enabled successfully',
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to enable SD campaign: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sd_update_ad_group',
    {
      description: 'Update a Sponsored Display ad group. Can change name, state, and default bid.',
      inputSchema: updateAdGroupSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const updateData: Partial<AdGroup> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.state !== undefined) updateData.state = input.state;
        if (input.defaultBid !== undefined) updateData.defaultBid = input.defaultBid;

        const updated = await client.put<AdGroup>(
          `/sd/adGroups`,
          [{ ...updateData, adGroupId: input.adGroupId }],
          { rateLimitCategory: 'adGroups' }
        );

        const result = Array.isArray(updated) ? updated[0] : updated;

        return makeToolResponse({
          adGroupId: result.adGroupId,
          name: result.name,
          state: result.state,
          defaultBid: result.defaultBid,
          message: 'Ad group updated successfully',
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to update SD ad group: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
