import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../client/ads-api-client.js';
import { makeToolResponse } from 'amazon-mcp-common';

function handleSBError(error: unknown, action: string): never {
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
  throw new AdsAPIError(`Failed to ${action}: ${error instanceof Error ? error.message : String(error)}`);
}

const listStoresSchema = z.object({});

const getStoreSchema = z.object({
  brandEntityId: z.string().min(1).describe('The brand entity ID'),
});

const getStoreAsinListSchema = z.object({
  brandEntityId: z.string().min(1).describe('The brand entity ID'),
});

const uploadImageSchema = z.object({
  mediaType: z.enum(['image']).describe('Media type'),
  programType: z.enum(['SB']).describe('Program type'),
  creativeType: z.enum(['BRAND_LOGO', 'BRAND_HEADLINE']).describe('Creative type'),
});

const uploadVideoSchema = z.object({
  mediaType: z.enum(['video']).describe('Media type'),
  programType: z.enum(['SBV']).describe('Program type'),
});

const getMediaStatusSchema = z.object({
  mediaId: z.string().min(1).describe('The media ID'),
});

const listMediaSchema = z.object({});

const listLandingPagesSchema = z.object({});

const getLandingPageSchema = z.object({
  landingPageId: z.string().min(1).describe('The landing page ID'),
});

export function registerSBCreativeTools(server: McpServer): void {
  server.registerTool(
    'sb_list_stores',
    {
      description: 'List all Amazon Stores for your brand. Requires Brand Registry.',
      inputSchema: listStoresSchema,
    },
    async () => {
      const client = getAdsAPIClient();
      try {
        const result = await client.get<{ stores: unknown[]; count?: number }>(
          '/stores/v0/stores',
          undefined,
          { rateLimitCategory: 'sbStores' }
        );
        return makeToolResponse({
          stores: result.stores ?? [],
          count: result.count ?? (result.stores?.length ?? 0),
        });
      } catch (error) {
        handleSBError(error, 'list stores');
      }
    }
  );

  server.registerTool(
    'sb_get_store',
    {
      description: 'Get details for a specific Amazon Store by brand entity ID. Requires Brand Registry.',
      inputSchema: getStoreSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const store = await client.get<Record<string, unknown>>(
          `/stores/v0/stores/${input.brandEntityId}`,
          undefined,
          { rateLimitCategory: 'sbStores' }
        );
        return makeToolResponse(store);
      } catch (error) {
        handleSBError(error, `get store ${input.brandEntityId}`);
      }
    }
  );

  server.registerTool(
    'sb_get_store_asin_list',
    {
      description: 'Get the list of ASINs associated with a specific Amazon Store. Requires Brand Registry.',
      inputSchema: getStoreAsinListSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const result = await client.get<Record<string, unknown>>(
          `/stores/v0/stores/${input.brandEntityId}/asins`,
          undefined,
          { rateLimitCategory: 'sbStores' }
        );
        return makeToolResponse(result);
      } catch (error) {
        handleSBError(error, `get store ASIN list for ${input.brandEntityId}`);
      }
    }
  );

  server.registerTool(
    'sb_upload_image',
    {
      description: 'Upload an image creative asset for Sponsored Brands. Requires Brand Registry.',
      inputSchema: uploadImageSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const result = await client.post<Record<string, unknown>>(
          '/v2/hs/media/upload',
          {
            mediaType: input.mediaType,
            programType: input.programType,
            creativeType: input.creativeType,
          },
          { rateLimitCategory: 'sbCreative' }
        );
        return makeToolResponse(result);
      } catch (error) {
        handleSBError(error, 'upload image');
      }
    }
  );

  server.registerTool(
    'sb_upload_video',
    {
      description: 'Upload a video creative asset for Sponsored Brands Video. Requires Brand Registry.',
      inputSchema: uploadVideoSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const result = await client.post<Record<string, unknown>>(
          '/v2/hs/media/upload',
          {
            mediaType: input.mediaType,
            programType: input.programType,
          },
          { rateLimitCategory: 'sbCreative' }
        );
        return makeToolResponse(result);
      } catch (error) {
        handleSBError(error, 'upload video');
      }
    }
  );

  server.registerTool(
    'sb_get_media_status',
    {
      description: 'Get the status of a specific media asset by ID. Requires Brand Registry.',
      inputSchema: getMediaStatusSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const result = await client.get<Record<string, unknown>>(
          `/v2/hs/media/${input.mediaId}`,
          undefined,
          { rateLimitCategory: 'sbCreative' }
        );
        return makeToolResponse(result);
      } catch (error) {
        handleSBError(error, `get media status ${input.mediaId}`);
      }
    }
  );

  server.registerTool(
    'sb_list_media',
    {
      description: 'List all media assets for Sponsored Brands. Requires Brand Registry.',
      inputSchema: listMediaSchema,
    },
    async () => {
      const client = getAdsAPIClient();
      try {
        const result = await client.get<{ media: unknown[]; count?: number }>(
          '/v2/hs/media',
          undefined,
          { rateLimitCategory: 'sbCreative' }
        );
        return makeToolResponse({
          media: result.media ?? [],
          count: result.count ?? (result.media?.length ?? 0),
        });
      } catch (error) {
        handleSBError(error, 'list media');
      }
    }
  );

  server.registerTool(
    'sb_list_landing_pages',
    {
      description: 'List all landing pages for Sponsored Brands. Requires Brand Registry.',
      inputSchema: listLandingPagesSchema,
    },
    async () => {
      const client = getAdsAPIClient();
      try {
        const result = await client.get<{ landingPages: unknown[]; count?: number }>(
          '/v2/hs/landingPages',
          undefined,
          { rateLimitCategory: 'sbLandingPages' }
        );
        return makeToolResponse({
          landingPages: result.landingPages ?? [],
          count: result.count ?? (result.landingPages?.length ?? 0),
        });
      } catch (error) {
        handleSBError(error, 'list landing pages');
      }
    }
  );

  server.registerTool(
    'sb_get_landing_page',
    {
      description: 'Get details for a specific landing page by ID. Requires Brand Registry.',
      inputSchema: getLandingPageSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const result = await client.get<Record<string, unknown>>(
          `/v2/hs/landingPages/${input.landingPageId}`,
          undefined,
          { rateLimitCategory: 'sbLandingPages' }
        );
        return makeToolResponse(result);
      } catch (error) {
        handleSBError(error, `get landing page ${input.landingPageId}`);
      }
    }
  );
}
