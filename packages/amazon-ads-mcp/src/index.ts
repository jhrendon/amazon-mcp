#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getConfig } from './config/index.js';
import { getAdsAPIClient } from './client/ads-api-client.js';
import { registerProfileTools } from './tools/profiles.js';

// Sponsored Products
import { registerSPCampaignTools } from './tools/sp/campaigns.js';
import { registerSPAdGroupTools } from './tools/sp/ad-groups.js';
import { registerSPKeywordTools } from './tools/sp/keywords.js';
import { registerSPTargetTools } from './tools/sp/targets.js';
import { registerSPProductAdTools } from './tools/sp/product-ads.js';

// Sponsored Brands
import { registerSBCampaignTools } from './tools/sb/campaigns.js';
import { registerSBAdGroupTools } from './tools/sb/ad-groups.js';
import { registerSBKeywordTools } from './tools/sb/keywords.js';

// Sponsored Display
import { registerSDCampaignTools } from './tools/sd/campaigns.js';
import { registerSDAdGroupTools } from './tools/sd/ad-groups.js';
import { registerSDTargetTools } from './tools/sd/targets.js';

// Reports
import { registerSPReportTools } from './tools/reports/sp-reports.js';
import { registerSBReportTools } from './tools/reports/sb-reports.js';
import { registerSDReportTools } from './tools/reports/sd-reports.js';

// Writes
import { registerSPWriteTools } from './tools/writes/sp-writes.js';
import { registerSBWriteTools } from './tools/writes/sb-writes.js';
import { registerSDWriteTools } from './tools/writes/sd-writes.js';

// Negative Keywords & Targets
import { registerNegativeTools } from './tools/negative.js';

// Optimization
import { registerSPKeywordSuggestionsTools } from './tools/optimization/sp-keyword-suggestions.js';
import { registerSBKeywordSuggestionsTools } from './tools/optimization/sb-keyword-suggestions.js';
import { registerCampaignAnalysisTools } from './tools/optimization/campaign-analysis.js';
import { registerNegativeKeywordTools } from './tools/optimization/negative-keywords.js';
import { registerAcosBreakdownTools } from './tools/optimization/acos-breakdown.js';

// Cross-MCP Integration
import { registerCrossMcpTools } from './tools/cross-mcp/correlate-reports.js';
import { registerTacosTools } from './tools/cross-mcp/tacos.js';
import { registerOrganicVsAdTools } from './tools/cross-mcp/organic-vs-ad.js';

// SB Creative, Stores & Video
import { registerSBCreativeTools } from './tools/sb-creative.js';

// Budget & Bid Recommendations
import { registerRecommendationsTools } from './tools/recommendations.js';

// Portfolios
import { registerPortfolioTools } from './tools/portfolios.js';

async function validateConnection(): Promise<boolean> {
  try {
    const client = getAdsAPIClient();
    await client.get('/v2/profiles', undefined, { rateLimitCategory: 'profiles' });
    return true;
  } catch (error) {
    console.error('Failed to connect to Amazon Ads API:', error);
    return false;
  }
}

async function main() {
  try {
    const config = getConfig();
    console.error(`Starting Amazon Ads MCP server for profile ${config.ADS_PROFILE_ID} (${config.ADS_API_REGION})`);

    const connected = await validateConnection();
    if (!connected) {
      console.error('Warning: Initial connection validation failed. Server will start but API calls may fail.');
    } else {
      console.error('Successfully connected to Amazon Ads API');
    }

    const server = new McpServer({
      name: 'amazon-ads-mcp',
      version: '0.1.0',
    });

    // Register all tools
    registerProfileTools(server);

    // Sponsored Products
    registerSPCampaignTools(server);
    registerSPAdGroupTools(server);
    registerSPKeywordTools(server);
    registerSPTargetTools(server);
    registerSPProductAdTools(server);

    // Sponsored Brands
    registerSBCampaignTools(server);
    registerSBAdGroupTools(server);
    registerSBKeywordTools(server);

    // Sponsored Display
    registerSDCampaignTools(server);
    registerSDAdGroupTools(server);
    registerSDTargetTools(server);

    // Reports
    registerSPReportTools(server);
    registerSBReportTools(server);
    registerSDReportTools(server);

    // Writes
    registerSPWriteTools(server);
    registerSBWriteTools(server);
    registerSDWriteTools(server);

    // Negative Keywords & Targets
    registerNegativeTools(server);

    // Optimization
    registerSPKeywordSuggestionsTools(server);
    registerSBKeywordSuggestionsTools(server);
    registerCampaignAnalysisTools(server);
    registerNegativeKeywordTools(server);
    registerAcosBreakdownTools(server);

    // Cross-MCP Integration
    registerCrossMcpTools(server);
    registerTacosTools(server);
    registerOrganicVsAdTools(server);

    // SB Creative, Stores & Video
    registerSBCreativeTools(server);

    // Budget & Bid Recommendations
    registerRecommendationsTools(server);

    // Portfolios
    registerPortfolioTools(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Amazon Ads MCP server running on stdio');
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
