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

const dateRangeSchema = z.object({
  startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
  endDate: z.string().optional().describe('End date in YYYY-MM-DD format'),
}).optional();

const spGetBudgetRecommendationsSchema = z.object({
  campaignId: z.number().describe('Campaign ID'),
  dateRange: dateRangeSchema.describe('Optional date range for recommendations'),
});

const spGetCampaignBudgetRecommendationsSchema = z.object({
  campaignIds: z.array(z.number()).min(1).max(100).describe('Campaign IDs (max 100)'),
});

const sbGetBudgetRecommendationsSchema = z.object({
  campaignId: z.number().describe('Campaign ID'),
  dateRange: dateRangeSchema.describe('Optional date range for recommendations'),
});

const sdGetBudgetRecommendationsSchema = z.object({
  campaignId: z.number().describe('Campaign ID'),
  dateRange: dateRangeSchema.describe('Optional date range for recommendations'),
});

const spGetBidRecommendationsSchema = z.object({
  adGroupId: z.number().describe('Ad group ID'),
  keywords: z.array(z.object({
    keywordText: z.string().describe('Keyword text'),
    matchType: z.string().describe('Match type'),
  })).optional().describe('Keywords to get bid recommendations for'),
  targets: z.array(z.object({
    type: z.string().describe('Target type'),
    value: z.string().describe('Target value'),
  })).optional().describe('Targets to get bid recommendations for'),
});

const spGetTargetBidRecommendationsSchema = z.object({
  adGroupId: z.number().describe('Ad group ID'),
  targets: z.array(z.object({
    type: z.string().describe('Target type'),
    value: z.string().describe('Target value'),
  })).describe('Targets to get bid recommendations for'),
});

const sbGetBidRecommendationsSchema = z.object({
  adGroupId: z.number().describe('Ad group ID'),
  keywords: z.array(z.object({
    keywordText: z.string().describe('Keyword text'),
    matchType: z.string().describe('Match type'),
  })).optional().describe('Keywords to get bid recommendations for'),
});

const sdGetBidRecommendationsSchema = z.object({
  adGroupId: z.number().describe('Ad group ID'),
  targets: z.array(z.object({
    type: z.string().describe('Target type'),
    value: z.string().describe('Target value'),
  })).optional().describe('Targets to get bid recommendations for'),
});

const spListBudgetRulesSchema = z.object({});

const spCreateBudgetRuleSchema = z.object({
  name: z.string().min(1).describe('Rule name'),
  ruleType: z.enum(['SCHEDULE', 'PERFORMANCE']).describe('Rule type'),
  campaignIds: z.array(z.number()).min(1).describe('Campaign IDs to apply the rule to'),
  ruleDetails: z.record(z.unknown()).describe('Rule details object'),
});

const spUpdateBudgetRuleSchema = z.object({
  ruleId: z.number().describe('Rule ID to update'),
  name: z.string().optional().describe('New rule name'),
  ruleDetails: z.record(z.unknown()).optional().describe('New rule details'),
  state: z.enum(['ENABLED', 'PAUSED']).optional().describe('New state'),
});

export function registerRecommendationsTools(server: McpServer): void {
  server.registerTool(
    'sp_get_budget_recommendations',
    {
      description: 'Get budget recommendations for a Sponsored Products campaign.',
      inputSchema: spGetBudgetRecommendationsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const body: Record<string, unknown> = { campaignId: input.campaignId };
        if (input.dateRange) body.dateRange = input.dateRange;
        const result = await client.post<Record<string, unknown>>(
          '/v2/sp/campaigns/budgetRecommendations',
          body,
          { rateLimitCategory: 'budgetRecommendations' }
        );
        return makeToolResponse(result);
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SP budget recommendations: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_get_campaign_budget_recommendations',
    {
      description: 'Get budget recommendations for multiple Sponsored Products campaigns in a batch (max 100).',
      inputSchema: spGetCampaignBudgetRecommendationsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const result = await client.post<Record<string, unknown>>(
          '/v2/sp/campaigns/budgetRecommendations/batch',
          { campaignIds: input.campaignIds },
          { rateLimitCategory: 'budgetRecommendations' }
        );
        return makeToolResponse(result);
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SP campaign budget recommendations: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sb_get_budget_recommendations',
    {
      description: 'Get budget recommendations for a Sponsored Brands campaign. Requires Brand Registry.',
      inputSchema: sbGetBudgetRecommendationsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const body: Record<string, unknown> = { campaignId: input.campaignId };
        if (input.dateRange) body.dateRange = input.dateRange;
        const result = await client.post<Record<string, unknown>>(
          '/v2/hs/campaigns/budgetRecommendations',
          body,
          { rateLimitCategory: 'budgetRecommendations' }
        );
        return makeToolResponse(result);
      } catch (error) {
        handleSBError(error, 'get SB budget recommendations');
      }
    }
  );

  server.registerTool(
    'sd_get_budget_recommendations',
    {
      description: 'Get budget recommendations for a Sponsored Display campaign.',
      inputSchema: sdGetBudgetRecommendationsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const body: Record<string, unknown> = { campaignId: input.campaignId };
        if (input.dateRange) body.dateRange = input.dateRange;
        const result = await client.post<Record<string, unknown>>(
          '/sd/campaigns/budgetRecommendations',
          body,
          { rateLimitCategory: 'budgetRecommendations' }
        );
        return makeToolResponse(result);
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SD budget recommendations: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_get_bid_recommendations',
    {
      description: 'Get bid recommendations for keywords in a Sponsored Products ad group.',
      inputSchema: spGetBidRecommendationsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const body: Record<string, unknown> = { adGroupId: input.adGroupId };
        if (input.keywords) body.keywords = input.keywords;
        if (input.targets) body.targets = input.targets;
        const result = await client.post<Record<string, unknown>>(
          '/v2/sp/keywords/bidding/recommendations',
          body,
          { rateLimitCategory: 'bidRecommendations' }
        );
        return makeToolResponse(result);
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SP bid recommendations: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_get_target_bid_recommendations',
    {
      description: 'Get bid recommendations for targets in a Sponsored Products ad group.',
      inputSchema: spGetTargetBidRecommendationsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const result = await client.post<Record<string, unknown>>(
          '/v2/sp/targets/bidding/recommendations',
          { adGroupId: input.adGroupId, targets: input.targets },
          { rateLimitCategory: 'bidRecommendations' }
        );
        return makeToolResponse(result);
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SP target bid recommendations: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sb_get_bid_recommendations',
    {
      description: 'Get bid recommendations for keywords in a Sponsored Brands ad group. Requires Brand Registry.',
      inputSchema: sbGetBidRecommendationsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const body: Record<string, unknown> = { adGroupId: input.adGroupId };
        if (input.keywords) body.keywords = input.keywords;
        const result = await client.post<Record<string, unknown>>(
          '/v2/hs/keywords/bidding/recommendations',
          body,
          { rateLimitCategory: 'bidRecommendations' }
        );
        return makeToolResponse(result);
      } catch (error) {
        handleSBError(error, 'get SB bid recommendations');
      }
    }
  );

  server.registerTool(
    'sd_get_bid_recommendations',
    {
      description: 'Get bid recommendations for targets in a Sponsored Display ad group.',
      inputSchema: sdGetBidRecommendationsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const body: Record<string, unknown> = { adGroupId: input.adGroupId };
        if (input.targets) body.targets = input.targets;
        const result = await client.post<Record<string, unknown>>(
          '/sd/targets/bidding/recommendations',
          body,
          { rateLimitCategory: 'bidRecommendations' }
        );
        return makeToolResponse(result);
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SD bid recommendations: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_list_budget_rules',
    {
      description: 'List all budget rules for Sponsored Products campaigns.',
      inputSchema: spListBudgetRulesSchema,
    },
    async () => {
      const client = getAdsAPIClient();
      try {
        const result = await client.get<Record<string, unknown>[]>(
          '/v2/sp/campaigns/budgetRules',
          undefined,
          { rateLimitCategory: 'budgetRules' }
        );
        return makeToolResponse({
          budgetRules: result,
          count: Array.isArray(result) ? result.length : 0,
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to list SP budget rules: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_create_budget_rule',
    {
      description: 'Create a new budget rule for Sponsored Products campaigns.',
      inputSchema: spCreateBudgetRuleSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const result = await client.post<Record<string, unknown>>(
          '/v2/sp/campaigns/budgetRules',
          {
            name: input.name,
            ruleType: input.ruleType,
            campaignIds: input.campaignIds,
            ruleDetails: input.ruleDetails,
          },
          { rateLimitCategory: 'budgetRules' }
        );
        return makeToolResponse(result);
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to create SP budget rule: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sp_update_budget_rule',
    {
      description: 'Update an existing budget rule for Sponsored Products campaigns.',
      inputSchema: spUpdateBudgetRuleSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();
      try {
        const body: Record<string, unknown> = { ruleId: input.ruleId };
        if (input.name) body.name = input.name;
        if (input.ruleDetails) body.ruleDetails = input.ruleDetails;
        if (input.state) body.state = input.state;
        const result = await client.put<Record<string, unknown>>(
          '/v2/sp/campaigns/budgetRules',
          body,
          { rateLimitCategory: 'budgetRules' }
        );
        return makeToolResponse(result);
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to update SP budget rule: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
