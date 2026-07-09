import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../client/ads-api-client.js';
import { makeToolResponse } from 'amazon-mcp-common';

const listProfilesSchema = z.object({});

const getProfileSchema = z.object({
  profileId: z.number().describe('The advertising profile ID to retrieve'),
});

export function registerProfileTools(server: McpServer): void {
  server.registerTool(
    'list_profiles',
    {
      description:
        'List all advertising profiles accessible with your credentials. Use this to verify your connection and see available profiles.',
      inputSchema: listProfilesSchema,
    },
    async () => {
      const client = getAdsAPIClient();

      try {
        const profiles = await client.get<AdsProfile[]>(
          '/v2/profiles',
          undefined,
          { rateLimitCategory: 'profiles' }
        );

        return makeToolResponse({
          profiles: profiles.map((p) => ({
            profileId: p.profileId,
            countryCode: p.countryCode,
            currencyCode: p.currencyCode,
            timezone: p.timezone,
            dailyBudget: p.dailyBudget,
            accountInfo: {
              marketplaceStringId: p.accountInfo?.marketplaceStringId,
              id: p.accountInfo?.id,
              type: p.accountInfo?.type,
              name: p.accountInfo?.name,
              validPaymentMethod: p.accountInfo?.validPaymentMethod,
            },
          })),
          count: profiles.length,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) {
          throw error;
        }
        throw new AdsAPIError(
          `Failed to list profiles: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  server.registerTool(
    'get_profile',
    {
      description: 'Get details for a specific advertising profile by ID.',
      inputSchema: getProfileSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const profile = await client.get<AdsProfile>(
          `/v2/profiles/${input.profileId}`,
          undefined,
          { rateLimitCategory: 'profiles' }
        );

        return makeToolResponse({
          profileId: profile.profileId,
          countryCode: profile.countryCode,
          currencyCode: profile.currencyCode,
          timezone: profile.timezone,
          dailyBudget: profile.dailyBudget,
          accountInfo: {
            marketplaceStringId: profile.accountInfo?.marketplaceStringId,
            id: profile.accountInfo?.id,
            type: profile.accountInfo?.type,
            name: profile.accountInfo?.name,
            validPaymentMethod: profile.accountInfo?.validPaymentMethod,
          },
        });
      } catch (error) {
        if (error instanceof AdsAPIError) {
          throw error;
        }
        throw new AdsAPIError(
          `Failed to get profile ${input.profileId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}

interface AdsProfile {
  profileId: number;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  dailyBudget?: number;
  accountInfo?: {
    marketplaceStringId?: string;
    id?: string;
    type?: string;
    name?: string;
    validPaymentMethod?: boolean;
  };
}
