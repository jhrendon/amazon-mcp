import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../../client/ads-api-client.js';
import { makeToolResponse } from 'amazon-mcp-common';
import type { Campaign, AdGroup, Keyword } from '../../types/ads.js';

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

const updateKeywordSchema = z.object({
  keywordId: z.number().describe('Keyword ID to update'),
  state: z.enum(['ENABLED', 'PAUSED', 'ARCHIVED']).optional().describe('New keyword state'),
  bid: z.number().positive().optional().describe('New bid amount'),
});

const createKeywordSchema = z.object({
  campaignId: z.number().describe('Campaign ID'),
  adGroupId: z.number().describe('Ad group ID'),
  keywordText: z.string().min(1).describe('Keyword text'),
  matchType: z.enum(['EXACT', 'PHRASE', 'BROAD']).describe('Match type'),
  bid: z.number().positive().optional().describe('Bid amount'),
  state: z.enum(['ENABLED', 'PAUSED']).optional().default('ENABLED').describe('Initial state'),
});

export function registerSBWriteTools(server: McpServer): void {
  server.registerTool(
    'sb_update_campaign',
    {
      description: 'Update a Sponsored Brands campaign. Requires Brand Registry. Can change name, state, and daily budget.',
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
          `/v2/hs/campaigns`,
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
        if (error instanceof AdsAPIError) {
          if (error.statusCode === 403) {
            throw new AdsAPIError(
              'Sponsored Brands API requires Brand Registry. Please activate Brand Registry in Seller Central.',
              403,
              'BRAND_REGISTRY_REQUIRED',
              false
            );
          }
          throw error;
        }
        throw new AdsAPIError(`Failed to update SB campaign: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sb_pause_campaign',
    {
      description: 'Pause a Sponsored Brands campaign. Requires Brand Registry.',
      inputSchema: z.object({
        campaignId: z.number().describe('Campaign ID to pause'),
      }),
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const updated = await client.put<Campaign>(
          `/v2/hs/campaigns`,
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
        if (error instanceof AdsAPIError) {
          if (error.statusCode === 403) {
            throw new AdsAPIError(
              'Sponsored Brands API requires Brand Registry. Please activate Brand Registry in Seller Central.',
              403,
              'BRAND_REGISTRY_REQUIRED',
              false
            );
          }
          throw error;
        }
        throw new AdsAPIError(`Failed to pause SB campaign: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sb_enable_campaign',
    {
      description: 'Enable a Sponsored Brands campaign. Requires Brand Registry.',
      inputSchema: z.object({
        campaignId: z.number().describe('Campaign ID to enable'),
      }),
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const updated = await client.put<Campaign>(
          `/v2/hs/campaigns`,
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
        if (error instanceof AdsAPIError) {
          if (error.statusCode === 403) {
            throw new AdsAPIError(
              'Sponsored Brands API requires Brand Registry. Please activate Brand Registry in Seller Central.',
              403,
              'BRAND_REGISTRY_REQUIRED',
              false
            );
          }
          throw error;
        }
        throw new AdsAPIError(`Failed to enable SB campaign: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sb_update_ad_group',
    {
      description: 'Update a Sponsored Brands ad group. Requires Brand Registry.',
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
          `/v2/hs/adGroups`,
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
        if (error instanceof AdsAPIError) {
          if (error.statusCode === 403) {
            throw new AdsAPIError(
              'Sponsored Brands API requires Brand Registry. Please activate Brand Registry in Seller Central.',
              403,
              'BRAND_REGISTRY_REQUIRED',
              false
            );
          }
          throw error;
        }
        throw new AdsAPIError(`Failed to update SB ad group: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sb_update_keyword',
    {
      description: 'Update a Sponsored Brands keyword. Requires Brand Registry.',
      inputSchema: updateKeywordSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const updateData: Partial<Keyword> = {};
        if (input.state !== undefined) updateData.state = input.state;
        if (input.bid !== undefined) updateData.bid = input.bid;

        const updated = await client.put<Keyword>(
          `/v2/hs/keywords`,
          [{ ...updateData, keywordId: input.keywordId }],
          { rateLimitCategory: 'keywords' }
        );

        const result = Array.isArray(updated) ? updated[0] : updated;

        return makeToolResponse({
          keywordId: result.keywordId,
          keywordText: result.keywordText,
          state: result.state,
          bid: result.bid,
          message: 'Keyword updated successfully',
        });
      } catch (error) {
        if (error instanceof AdsAPIError) {
          if (error.statusCode === 403) {
            throw new AdsAPIError(
              'Sponsored Brands API requires Brand Registry. Please activate Brand Registry in Seller Central.',
              403,
              'BRAND_REGISTRY_REQUIRED',
              false
            );
          }
          throw error;
        }
        throw new AdsAPIError(`Failed to update SB keyword: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sb_update_keyword_bid',
    {
      description: 'Update the bid for a Sponsored Brands keyword. Requires Brand Registry.',
      inputSchema: z.object({
        keywordId: z.number().describe('Keyword ID'),
        bid: z.number().positive().describe('New bid amount'),
      }),
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const updated = await client.put<Keyword>(
          `/v2/hs/keywords`,
          [{ keywordId: input.keywordId, bid: input.bid }],
          { rateLimitCategory: 'keywords' }
        );

        const result = Array.isArray(updated) ? updated[0] : updated;

        return makeToolResponse({
          keywordId: result.keywordId,
          keywordText: result.keywordText,
          bid: result.bid,
          message: 'Keyword bid updated successfully',
        });
      } catch (error) {
        if (error instanceof AdsAPIError) {
          if (error.statusCode === 403) {
            throw new AdsAPIError(
              'Sponsored Brands API requires Brand Registry. Please activate Brand Registry in Seller Central.',
              403,
              'BRAND_REGISTRY_REQUIRED',
              false
            );
          }
          throw error;
        }
        throw new AdsAPIError(`Failed to update SB keyword bid: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sb_create_keyword',
    {
      description: 'Create a new Sponsored Brands keyword. Requires Brand Registry.',
      inputSchema: createKeywordSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const keywordData = {
          campaignId: input.campaignId,
          adGroupId: input.adGroupId,
          keywordText: input.keywordText,
          matchType: input.matchType,
          state: input.state,
          bid: input.bid,
        };

        const created = await client.post<Keyword>(
          `/v2/hs/keywords`,
          [keywordData],
          { rateLimitCategory: 'keywords' }
        );

        const result = Array.isArray(created) ? created[0] : created;

        return makeToolResponse({
          keywordId: result.keywordId,
          keywordText: result.keywordText,
          matchType: result.matchType,
          state: result.state,
          bid: result.bid,
          message: 'Keyword created successfully',
        });
      } catch (error) {
        if (error instanceof AdsAPIError) {
          if (error.statusCode === 403) {
            throw new AdsAPIError(
              'Sponsored Brands API requires Brand Registry. Please activate Brand Registry in Seller Central.',
              403,
              'BRAND_REGISTRY_REQUIRED',
              false
            );
          }
          throw error;
        }
        throw new AdsAPIError(`Failed to create SB keyword: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
