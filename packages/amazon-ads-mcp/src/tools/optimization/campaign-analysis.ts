import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../../client/ads-api-client.js';
import { makeToolResponse, ReportPoller } from 'amazon-mcp-common';

const analyzeCampaignPerformanceSchema = z.object({
  campaignType: z.enum(['sp', 'sb', 'sd']).describe('Campaign type to analyze'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Start date (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('End date (YYYY-MM-DD)'),
  segment: z.enum(['campaign', 'adGroup', 'keyword']).optional().default('campaign').describe('Segment level for analysis'),
});

export function registerCampaignAnalysisTools(server: McpServer): void {
  server.registerTool(
    'analyze_campaign_performance',
    {
      description: 'Analyze campaign performance metrics. Returns top and bottom performers with key metrics.',
      inputSchema: analyzeCampaignPerformanceSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const endpoint = input.campaignType === 'sp' 
          ? '/v2/sp/campaigns/report'
          : input.campaignType === 'sb'
          ? '/v2/hs/campaigns/report'
          : '/sd/campaigns/report';

        const body = {
          startDate: input.startDate,
          endDate: input.endDate,
          metrics: ['impressions', 'clicks', 'cost', 'sales', 'acos', 'roas'],
          segment: input.segment,
        };

        const createResponse = await client.post<{ reportId: string; recordId: string }>(
          endpoint,
          body,
          { rateLimitCategory: 'reports' }
        );

        const poller = new ReportPoller({
          client,
          getStatusPath: (reportId) => input.campaignType === 'sp'
            ? `/v2/sp/reports/${reportId}`
            : input.campaignType === 'sb'
            ? `/v2/hs/reports/${reportId}`
            : `/sd/reports/${reportId}`,
          getDownloadPath: (reportId) => input.campaignType === 'sp'
            ? `/v2/sp/reports/${reportId}/download`
            : input.campaignType === 'sb'
            ? `/v2/hs/reports/${reportId}/download`
            : `/sd/reports/${reportId}/download`,
        });

        const status = await poller.waitForCompletion(createResponse.reportId, {
          maxWaitMs: 300000,
          pollIntervalMs: 5000,
        });

        if (status.status !== 'DONE') {
          throw new AdsAPIError(
            `Report generation failed with status: ${status.status}`,
            undefined,
            'REPORT_FAILED',
            false,
            status.failureReason
          );
        }

        const tempDir = process.env.TEMP || process.env.TMP || '/tmp';
        const outputPath = `${tempDir}/${input.campaignType}-performance-${createResponse.reportId}.json.gz`;

        await poller.downloadReport(createResponse.reportId, outputPath);

        const fs = await import('fs/promises');
        const zlib = await import('zlib');
        const compressed = await fs.readFile(outputPath);
        const decompressed = zlib.gunzipSync(compressed);
        const reportData = JSON.parse(decompressed.toString('utf-8')) as Array<{
          campaignId: number;
          campaignName?: string;
          impressions: number;
          clicks: number;
          cost: number;
          sales: number;
          acos?: number;
          roas?: number;
        }>;

        const sorted = reportData
          .filter(r => r.sales > 0 || r.cost > 0)
          .sort((a, b) => (b.sales || 0) - (a.sales || 0));

        const topPerformers = sorted.slice(0, 5).map(r => ({
          campaignId: r.campaignId,
          campaignName: r.campaignName,
          sales: r.sales,
          cost: r.cost,
          acos: r.acos ? (r.acos * 100).toFixed(2) + '%' : 'N/A',
          roas: r.roas ? r.roas.toFixed(2) : 'N/A',
          impressions: r.impressions,
          clicks: r.clicks,
        }));

        const bottomPerformers = sorted
          .filter(r => r.cost > 0 && (r.sales === 0 || (r.acos && r.acos > 1)))
          .slice(-5)
          .reverse()
          .map(r => ({
            campaignId: r.campaignId,
            campaignName: r.campaignName,
            sales: r.sales || 0,
            cost: r.cost,
            acos: r.acos ? (r.acos * 100).toFixed(2) + '%' : 'N/A',
            roas: r.roas ? r.roas.toFixed(2) : 'N/A',
            impressions: r.impressions,
            clicks: r.clicks,
          }));

        const totalSales = reportData.reduce((sum, r) => sum + (r.sales || 0), 0);
        const totalCost = reportData.reduce((sum, r) => sum + (r.cost || 0), 0);
        const overallAcos = totalCost > 0 ? (totalCost / totalSales) : 0;

        return makeToolResponse({
          reportId: createResponse.reportId,
          period: { startDate: input.startDate, endDate: input.endDate },
          summary: {
            totalCampaigns: reportData.length,
            totalSales: totalSales.toFixed(2),
            totalCost: totalCost.toFixed(2),
            overallAcos: (overallAcos * 100).toFixed(2) + '%',
          },
          topPerformers,
          bottomPerformers,
          recommendations: generateRecommendations(topPerformers, bottomPerformers, overallAcos),
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to analyze campaign performance: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}

function generateRecommendations(
  topPerformers: Array<{ campaignId: number; acos: string; cost: number }>,
  bottomPerformers: Array<{ campaignId: number; acos: string; cost: number }>,
  overallAcos: number
): string[] {
  const recommendations: string[] = [];

  if (overallAcos > 0.5) {
    recommendations.push('Overall ACoS is above 50%. Consider reducing bids or pausing underperforming campaigns.');
  }

  if (bottomPerformers.length > 0) {
    const highCostLowReturn = bottomPerformers.filter(p => p.cost > 10 && p.acos === 'N/A');
    if (highCostLowReturn.length > 0) {
      recommendations.push(`${highCostLowReturn.length} campaign(s) have spend but no sales. Consider pausing them.`);
    }
  }

  if (topPerformers.length > 0) {
    const lowAcos = topPerformers.filter(p => p.acos !== 'N/A' && parseFloat(p.acos) < 20);
    if (lowAcos.length > 0) {
      recommendations.push(`${lowAcos.length} campaign(s) have ACoS below 20%. Consider increasing bids to scale.`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Campaign performance is within acceptable ranges. Continue monitoring.');
  }

  return recommendations;
}
