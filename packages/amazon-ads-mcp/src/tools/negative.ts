import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../client/ads-api-client.js';
import { makeToolResponse } from 'amazon-mcp-common';
import type { NegativeKeyword, NegativeTarget } from '../types/ads.js';

const listNegativeKeywordsSchema = z.object({
  stateFilter: z.enum(['ENABLED', 'PAUSED', 'ARCHIVED']).optional().describe('Filter by negative keyword state'),
  campaignIdFilter: z.array(z.number()).optional().describe('Filter by campaign IDs'),
  adGroupIdFilter: z.array(z.number()).optional().describe('Filter by ad group IDs'),
  keywordIdFilter: z.array(z.number()).optional().describe('Filter by keyword IDs'),
  pageSize: z.number().min(1).max(1000).optional().describe('Number of results per page'),
  startIndex: z.number().min(0).optional().describe('Starting index for pagination'),
});

const getNegativeKeywordSchema = z.object({
  keywordId: z.number().describe('The negative keyword ID to retrieve'),
});

const listNegativeTargetsSchema = z.object({
  stateFilter: z.enum(['ENABLED', 'PAUSED', 'ARCHIVED']).optional().describe('Filter by negative target state'),
  campaignIdFilter: z.array(z.number()).optional().describe('Filter by campaign IDs'),
  adGroupIdFilter: z.array(z.number()).optional().describe('Filter by ad group IDs'),
  targetIdFilter: z.array(z.number()).optional().describe('Filter by target IDs'),
  pageSize: z.number().min(1).max(1000).optional().describe('Number of results per page'),
  startIndex: z.number().min(0).optional().describe('Starting index for pagination'),
});

const getNegativeTargetSchema = z.object({
  targetId: z.number().describe('The negative target ID to retrieve'),
});

const createNegativeKeywordItemSchema = z.object({
  campaignId: z.number().describe('Campaign ID'),
  adGroupId: z.number().describe('Ad group ID'),
  keywordText: z.string().min(1).describe('Negative keyword text'),
  matchType: z.enum(['NEGATIVE_EXACT', 'NEGATIVE_PHRASE']).describe('Negative match type'),
  state: z.enum(['ENABLED', 'PAUSED']).optional().default('ENABLED').describe('Initial state'),
});

const createNegativeKeywordsSchema = z.object({
  negativeKeywords: z.array(createNegativeKeywordItemSchema).min(1).describe('Negative keywords to create'),
});

const updateNegativeKeywordItemSchema = z.object({
  keywordId: z.number().describe('Negative keyword ID'),
  state: z.enum(['ENABLED', 'PAUSED', 'ARCHIVED']).optional().describe('New state'),
  matchType: z.enum(['NEGATIVE_EXACT', 'NEGATIVE_PHRASE']).optional().describe('New match type'),
});

const updateNegativeKeywordsSchema = z.object({
  negativeKeywords: z.array(updateNegativeKeywordItemSchema).min(1).describe('Negative keywords to update'),
});

const deleteNegativeKeywordsSchema = z.object({
  negativeKeywordIds: z.array(z.number()).min(1).describe('Negative keyword IDs to delete'),
});

const createNegativeTargetItemSchema = z.object({
  campaignId: z.number().describe('Campaign ID'),
  adGroupId: z.number().describe('Ad group ID'),
  expressionType: z.string().describe('Expression type'),
  expression: z.array(z.object({
    type: z.string().describe('Expression type'),
    value: z.string().describe('Expression value'),
  })).describe('Targeting expression'),
  state: z.enum(['ENABLED', 'PAUSED']).optional().default('ENABLED').describe('Initial state'),
});

const createNegativeTargetsSchema = z.object({
  negativeTargets: z.array(createNegativeTargetItemSchema).min(1).describe('Negative targets to create'),
});

const updateNegativeTargetItemSchema = z.object({
  targetId: z.number().describe('Negative target ID'),
  state: z.enum(['ENABLED', 'PAUSED', 'ARCHIVED']).optional().describe('New state'),
  expressionType: z.string().optional().describe('New expression type'),
  expression: z.array(z.object({
    type: z.string().describe('Expression type'),
    value: z.string().describe('Expression value'),
  })).optional().describe('New targeting expression'),
});

const updateNegativeTargetsSchema = z.object({
  negativeTargets: z.array(updateNegativeTargetItemSchema).min(1).describe('Negative targets to update'),
});

const deleteNegativeTargetsSchema = z.object({
  negativeTargetIds: z.array(z.number()).min(1).describe('Negative target IDs to delete'),
});

function buildListParams(input: {
  stateFilter?: string;
  campaignIdFilter?: number[];
  adGroupIdFilter?: number[];
  keywordIdFilter?: number[];
  pageSize?: number;
  startIndex?: number;
}): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (input.stateFilter) params.stateFilter = input.stateFilter;
  if (input.campaignIdFilter) params.campaignIdFilter = input.campaignIdFilter.join(',');
  if (input.adGroupIdFilter) params.adGroupIdFilter = input.adGroupIdFilter.join(',');
  if (input.keywordIdFilter) params.keywordIdFilter = input.keywordIdFilter.join(',');
  if (input.pageSize) params.pageSize = input.pageSize;
  if (input.startIndex !== undefined) params.startIndex = input.startIndex;
  return params;
}

function buildListTargetParams(input: {
  stateFilter?: string;
  campaignIdFilter?: number[];
  adGroupIdFilter?: number[];
  targetIdFilter?: number[];
  pageSize?: number;
  startIndex?: number;
}): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (input.stateFilter) params.stateFilter = input.stateFilter;
  if (input.campaignIdFilter) params.campaignIdFilter = input.campaignIdFilter.join(',');
  if (input.adGroupIdFilter) params.adGroupIdFilter = input.adGroupIdFilter.join(',');
  if (input.targetIdFilter) params.targetIdFilter = input.targetIdFilter.join(',');
  if (input.pageSize) params.pageSize = input.pageSize;
  if (input.startIndex !== undefined) params.startIndex = input.startIndex;
  return params;
}

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

export function registerNegativeTools(server: McpServer): void {
  server.registerTool(
    'sp_list_negative_keywords',
    {
      description: 'List all Sponsored Products negative keywords. Use filters to narrow results.',
      inputSchema: listNegativeKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const params = buildListParams(input);
        const negativeKeywords = await client.get<NegativeKeyword[]>(
          '/v2/sp/negativeKeywords',
          params,
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          negativeKeywords: negativeKeywords.map((nk) => ({
            keywordId: nk.keywordId,
            campaignId: nk.campaignId,
            adGroupId: nk.adGroupId,
            keywordText: nk.keywordText,
            matchType: nk.matchType,
            state: nk.state,
          })),
          count: negativeKeywords.length,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to list SP negative keywords: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_get_negative_keyword',
    {
      description: 'Get details for a specific Sponsored Products negative keyword by ID.',
      inputSchema: getNegativeKeywordSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const nk = await client.get<NegativeKeyword>(
          `/v2/sp/negativeKeywords/${input.keywordId}`,
          undefined,
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          keywordId: nk.keywordId,
          campaignId: nk.campaignId,
          adGroupId: nk.adGroupId,
          keywordText: nk.keywordText,
          matchType: nk.matchType,
          state: nk.state,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SP negative keyword ${input.keywordId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sb_list_negative_keywords',
    {
      description: 'List all Sponsored Brands negative keywords. Requires Brand Registry.',
      inputSchema: listNegativeKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const params = buildListParams(input);
        const negativeKeywords = await client.get<NegativeKeyword[]>(
          '/v2/hs/negativeKeywords',
          params,
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          negativeKeywords: negativeKeywords.map((nk) => ({
            keywordId: nk.keywordId,
            campaignId: nk.campaignId,
            adGroupId: nk.adGroupId,
            keywordText: nk.keywordText,
            matchType: nk.matchType,
            state: nk.state,
          })),
          count: negativeKeywords.length,
        });
      } catch (error) {
        handleSBError(error, 'list SB negative keywords');
      }
    }
  );

  server.registerTool(
    'sb_get_negative_keyword',
    {
      description: 'Get details for a specific Sponsored Brands negative keyword by ID. Requires Brand Registry.',
      inputSchema: getNegativeKeywordSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const nk = await client.get<NegativeKeyword>(
          `/v2/hs/negativeKeywords/${input.keywordId}`,
          undefined,
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          keywordId: nk.keywordId,
          campaignId: nk.campaignId,
          adGroupId: nk.adGroupId,
          keywordText: nk.keywordText,
          matchType: nk.matchType,
          state: nk.state,
        });
      } catch (error) {
        handleSBError(error, `get SB negative keyword ${input.keywordId}`);
      }
    }
  );

  server.registerTool(
    'sd_list_negative_keywords',
    {
      description: 'List all Sponsored Display negative keywords.',
      inputSchema: listNegativeKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const params = buildListParams(input);
        const negativeKeywords = await client.get<NegativeKeyword[]>(
          '/sd/negativeKeywords',
          params,
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          negativeKeywords: negativeKeywords.map((nk) => ({
            keywordId: nk.keywordId,
            campaignId: nk.campaignId,
            adGroupId: nk.adGroupId,
            keywordText: nk.keywordText,
            matchType: nk.matchType,
            state: nk.state,
          })),
          count: negativeKeywords.length,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to list SD negative keywords: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sd_get_negative_keyword',
    {
      description: 'Get details for a specific Sponsored Display negative keyword by ID.',
      inputSchema: getNegativeKeywordSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const nk = await client.get<NegativeKeyword>(
          `/sd/negativeKeywords/${input.keywordId}`,
          undefined,
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          keywordId: nk.keywordId,
          campaignId: nk.campaignId,
          adGroupId: nk.adGroupId,
          keywordText: nk.keywordText,
          matchType: nk.matchType,
          state: nk.state,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SD negative keyword ${input.keywordId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_list_negative_targets',
    {
      description: 'List all Sponsored Products negative targets. Use filters to narrow results.',
      inputSchema: listNegativeTargetsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const params = buildListTargetParams(input);
        const negativeTargets = await client.get<NegativeTarget[]>(
          '/v2/sp/negativeTargets',
          params,
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          negativeTargets: negativeTargets.map((nt) => ({
            targetId: nt.targetId,
            campaignId: nt.campaignId,
            adGroupId: nt.adGroupId,
            state: nt.state,
            expressionType: nt.expressionType,
            expression: nt.expression,
          })),
          count: negativeTargets.length,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to list SP negative targets: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_get_negative_target',
    {
      description: 'Get details for a specific Sponsored Products negative target by ID.',
      inputSchema: getNegativeTargetSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const nt = await client.get<NegativeTarget>(
          `/v2/sp/negativeTargets/${input.targetId}`,
          undefined,
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          targetId: nt.targetId,
          campaignId: nt.campaignId,
          adGroupId: nt.adGroupId,
          state: nt.state,
          expressionType: nt.expressionType,
          expression: nt.expression,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SP negative target ${input.targetId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sb_list_negative_targets',
    {
      description: 'List all Sponsored Brands negative targets. Requires Brand Registry.',
      inputSchema: listNegativeTargetsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const params = buildListTargetParams(input);
        const negativeTargets = await client.get<NegativeTarget[]>(
          '/v2/hs/negativeTargets',
          params,
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          negativeTargets: negativeTargets.map((nt) => ({
            targetId: nt.targetId,
            campaignId: nt.campaignId,
            adGroupId: nt.adGroupId,
            state: nt.state,
            expressionType: nt.expressionType,
            expression: nt.expression,
          })),
          count: negativeTargets.length,
        });
      } catch (error) {
        handleSBError(error, 'list SB negative targets');
      }
    }
  );

  server.registerTool(
    'sb_get_negative_target',
    {
      description: 'Get details for a specific Sponsored Brands negative target by ID. Requires Brand Registry.',
      inputSchema: getNegativeTargetSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const nt = await client.get<NegativeTarget>(
          `/v2/hs/negativeTargets/${input.targetId}`,
          undefined,
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          targetId: nt.targetId,
          campaignId: nt.campaignId,
          adGroupId: nt.adGroupId,
          state: nt.state,
          expressionType: nt.expressionType,
          expression: nt.expression,
        });
      } catch (error) {
        handleSBError(error, `get SB negative target ${input.targetId}`);
      }
    }
  );

  server.registerTool(
    'sd_list_negative_targets',
    {
      description: 'List all Sponsored Display negative targets.',
      inputSchema: listNegativeTargetsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const params = buildListTargetParams(input);
        const negativeTargets = await client.get<NegativeTarget[]>(
          '/sd/negativeTargets',
          params,
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          negativeTargets: negativeTargets.map((nt) => ({
            targetId: nt.targetId,
            campaignId: nt.campaignId,
            adGroupId: nt.adGroupId,
            state: nt.state,
            expressionType: nt.expressionType,
            expression: nt.expression,
          })),
          count: negativeTargets.length,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to list SD negative targets: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sd_get_negative_target',
    {
      description: 'Get details for a specific Sponsored Display negative target by ID.',
      inputSchema: getNegativeTargetSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const nt = await client.get<NegativeTarget>(
          `/sd/negativeTargets/${input.targetId}`,
          undefined,
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          targetId: nt.targetId,
          campaignId: nt.campaignId,
          adGroupId: nt.adGroupId,
          state: nt.state,
          expressionType: nt.expressionType,
          expression: nt.expression,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SD negative target ${input.targetId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_create_negative_keywords',
    {
      description: 'Create negative keywords for Sponsored Products campaigns.',
      inputSchema: createNegativeKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const created = await client.post<NegativeKeyword[]>(
          '/v2/sp/negativeKeywords',
          input.negativeKeywords,
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          negativeKeywords: created,
          count: created.length,
          message: `Created ${created.length} negative keyword(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to create SP negative keywords: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_update_negative_keywords',
    {
      description: 'Update negative keywords for Sponsored Products campaigns.',
      inputSchema: updateNegativeKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const updated = await client.put<NegativeKeyword[]>(
          '/v2/sp/negativeKeywords',
          input.negativeKeywords,
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          negativeKeywords: updated,
          count: updated.length,
          message: `Updated ${updated.length} negative keyword(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to update SP negative keywords: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_delete_negative_keywords',
    {
      description: 'Delete negative keywords from Sponsored Products campaigns.',
      inputSchema: deleteNegativeKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const deleted = await client.delete<NegativeKeyword[]>(
          '/v2/sp/negativeKeywords',
          { keywordIds: input.negativeKeywordIds },
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          negativeKeywords: deleted,
          count: deleted.length,
          message: `Deleted ${deleted.length} negative keyword(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to delete SP negative keywords: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sb_create_negative_keywords',
    {
      description: 'Create negative keywords for Sponsored Brands campaigns. Requires Brand Registry.',
      inputSchema: createNegativeKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const created = await client.post<NegativeKeyword[]>(
          '/v2/hs/negativeKeywords',
          input.negativeKeywords,
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          negativeKeywords: created,
          count: created.length,
          message: `Created ${created.length} negative keyword(s)`,
        });
      } catch (error) {
        handleSBError(error, 'create SB negative keywords');
      }
    }
  );

  server.registerTool(
    'sb_update_negative_keywords',
    {
      description: 'Update negative keywords for Sponsored Brands campaigns. Requires Brand Registry.',
      inputSchema: updateNegativeKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const updated = await client.put<NegativeKeyword[]>(
          '/v2/hs/negativeKeywords',
          input.negativeKeywords,
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          negativeKeywords: updated,
          count: updated.length,
          message: `Updated ${updated.length} negative keyword(s)`,
        });
      } catch (error) {
        handleSBError(error, 'update SB negative keywords');
      }
    }
  );

  server.registerTool(
    'sb_delete_negative_keywords',
    {
      description: 'Delete negative keywords from Sponsored Brands campaigns. Requires Brand Registry.',
      inputSchema: deleteNegativeKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const deleted = await client.delete<NegativeKeyword[]>(
          '/v2/hs/negativeKeywords',
          { keywordIds: input.negativeKeywordIds },
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          negativeKeywords: deleted,
          count: deleted.length,
          message: `Deleted ${deleted.length} negative keyword(s)`,
        });
      } catch (error) {
        handleSBError(error, 'delete SB negative keywords');
      }
    }
  );

  server.registerTool(
    'sd_create_negative_keywords',
    {
      description: 'Create negative keywords for Sponsored Display campaigns.',
      inputSchema: createNegativeKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const created = await client.post<NegativeKeyword[]>(
          '/sd/negativeKeywords',
          input.negativeKeywords,
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          negativeKeywords: created,
          count: created.length,
          message: `Created ${created.length} negative keyword(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to create SD negative keywords: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sd_update_negative_keywords',
    {
      description: 'Update negative keywords for Sponsored Display campaigns.',
      inputSchema: updateNegativeKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const updated = await client.put<NegativeKeyword[]>(
          '/sd/negativeKeywords',
          input.negativeKeywords,
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          negativeKeywords: updated,
          count: updated.length,
          message: `Updated ${updated.length} negative keyword(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to update SD negative keywords: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sd_delete_negative_keywords',
    {
      description: 'Delete negative keywords from Sponsored Display campaigns.',
      inputSchema: deleteNegativeKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const deleted = await client.delete<NegativeKeyword[]>(
          '/sd/negativeKeywords',
          { keywordIds: input.negativeKeywordIds },
          { rateLimitCategory: 'negativeKeywords' }
        );
        return makeToolResponse({
          negativeKeywords: deleted,
          count: deleted.length,
          message: `Deleted ${deleted.length} negative keyword(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to delete SD negative keywords: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_create_negative_targets',
    {
      description: 'Create negative targets for Sponsored Products campaigns.',
      inputSchema: createNegativeTargetsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const created = await client.post<NegativeTarget[]>(
          '/v2/sp/negativeTargets',
          input.negativeTargets,
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          negativeTargets: created,
          count: created.length,
          message: `Created ${created.length} negative target(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to create SP negative targets: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_update_negative_targets',
    {
      description: 'Update negative targets for Sponsored Products campaigns.',
      inputSchema: updateNegativeTargetsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const updated = await client.put<NegativeTarget[]>(
          '/v2/sp/negativeTargets',
          input.negativeTargets,
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          negativeTargets: updated,
          count: updated.length,
          message: `Updated ${updated.length} negative target(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to update SP negative targets: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_delete_negative_targets',
    {
      description: 'Delete negative targets from Sponsored Products campaigns.',
      inputSchema: deleteNegativeTargetsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const deleted = await client.delete<NegativeTarget[]>(
          '/v2/sp/negativeTargets',
          { targetIds: input.negativeTargetIds },
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          negativeTargets: deleted,
          count: deleted.length,
          message: `Deleted ${deleted.length} negative target(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to delete SP negative targets: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sb_create_negative_targets',
    {
      description: 'Create negative targets for Sponsored Brands campaigns. Requires Brand Registry.',
      inputSchema: createNegativeTargetsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const created = await client.post<NegativeTarget[]>(
          '/v2/hs/negativeTargets',
          input.negativeTargets,
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          negativeTargets: created,
          count: created.length,
          message: `Created ${created.length} negative target(s)`,
        });
      } catch (error) {
        handleSBError(error, 'create SB negative targets');
      }
    }
  );

  server.registerTool(
    'sb_update_negative_targets',
    {
      description: 'Update negative targets for Sponsored Brands campaigns. Requires Brand Registry.',
      inputSchema: updateNegativeTargetsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const updated = await client.put<NegativeTarget[]>(
          '/v2/hs/negativeTargets',
          input.negativeTargets,
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          negativeTargets: updated,
          count: updated.length,
          message: `Updated ${updated.length} negative target(s)`,
        });
      } catch (error) {
        handleSBError(error, 'update SB negative targets');
      }
    }
  );

  server.registerTool(
    'sb_delete_negative_targets',
    {
      description: 'Delete negative targets from Sponsored Brands campaigns. Requires Brand Registry.',
      inputSchema: deleteNegativeTargetsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const deleted = await client.delete<NegativeTarget[]>(
          '/v2/hs/negativeTargets',
          { targetIds: input.negativeTargetIds },
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          negativeTargets: deleted,
          count: deleted.length,
          message: `Deleted ${deleted.length} negative target(s)`,
        });
      } catch (error) {
        handleSBError(error, 'delete SB negative targets');
      }
    }
  );

  server.registerTool(
    'sd_create_negative_targets',
    {
      description: 'Create negative targets for Sponsored Display campaigns.',
      inputSchema: createNegativeTargetsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const created = await client.post<NegativeTarget[]>(
          '/sd/negativeTargets',
          input.negativeTargets,
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          negativeTargets: created,
          count: created.length,
          message: `Created ${created.length} negative target(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to create SD negative targets: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sd_update_negative_targets',
    {
      description: 'Update negative targets for Sponsored Display campaigns.',
      inputSchema: updateNegativeTargetsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const updated = await client.put<NegativeTarget[]>(
          '/sd/negativeTargets',
          input.negativeTargets,
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          negativeTargets: updated,
          count: updated.length,
          message: `Updated ${updated.length} negative target(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to update SD negative targets: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sd_delete_negative_targets',
    {
      description: 'Delete negative targets from Sponsored Display campaigns.',
      inputSchema: deleteNegativeTargetsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const deleted = await client.delete<NegativeTarget[]>(
          '/sd/negativeTargets',
          { targetIds: input.negativeTargetIds },
          { rateLimitCategory: 'negativeTargets' }
        );
        return makeToolResponse({
          negativeTargets: deleted,
          count: deleted.length,
          message: `Deleted ${deleted.length} negative target(s)`,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to delete SD negative targets: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
