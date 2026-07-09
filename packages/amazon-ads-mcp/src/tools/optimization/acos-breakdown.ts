import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../../client/ads-api-client.js';
import { makeToolResponse, ReportPoller } from 'amazon-mcp-common';

const calculateAcosBreakdownSchema = z.object({
  campaignType: z.enum(['sp', 'sb', 'sd']).describe('Campaign type'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Start date (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('End date (YYYY-MM-DD)'),
  segment: z.enum(['campaign', 'adGroup', 'keyword']).optional().default('campaign').describe('Segment level for breakdown'),
  campaignIdFilter: z.array(z.number()).optional().describe('Filter by specific campaign IDs'),
});

export function registerAcosBreakdownTools(server: McpServer): void {
  server.registerTool(
    'calculate_acos_breakdown',
    {
      description: 'Calculate ACoS breakdown by campaign, ad group, or keyword. Returns detailed metrics for each segment.',
      inputSchema: calculateAcosBreakdownSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        let endpoint: string;
        let segmentField: string;

        if (input.segment === 'campaign') {
          endpoint = input.campaignType === 'sp'
            ? '/v2/sp/campaigns/report'
            : input.campaignType === 'sb'
            ? '/v2/hs/campaigns/report'
            : '/sd/campaigns/report';
          segmentField = 'campaignId';
        } else if (input.segment === 'adGroup') {
          endpoint = input.campaignType === 'sp'
            ? '/v2/sp/adGroups/report'
            : input.campaignType === 'sb'
            ? '/v2/hs/adGroups/report'
            : '/sd/adGroups/report';
          segmentField = 'adGroupId';
        } else {
          endpoint = input.campaignType === 'sp'
            ? '/v2/sp/keywords/report'
            : input.campaignType === 'sb'
            ? '/v2/hs/keywords/report'
            : '/sd/targets/report';
          segmentField = 'keywordId';
        }

        const body: Record<string, unknown> = {
          startDate: input.startDate,
          endDate: input.endDate,
          metrics: ['impressions', 'clicks', 'cost', 'sales', 'orders'],
        };

        if (input.campaignIdFilter && input.campaignIdFilter.length > 0) {
          body.campaignIdFilter = input.campaignIdFilter;
        }

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
        const outputPath = `${tempDir}/${input.campaignType}-acos-${input.segment}-${createResponse.reportId}.json.gz`;

        await poller.downloadReport(createResponse.reportId, outputPath);

        const fs = await import('fs/promises');
        const zlib = await import('zlib');
        const compressed = await fs.readFile(outputPath);
        const decompressed = zlib.gunzipSync(compressed);
        const reportData = JSON.parse(decompressed.toString('utf-8')) as Array<{
          campaignId: number;
          campaignName?: string;
          adGroupId?: number;
          adGroupName?: string;
          keywordId?: number;
          keywordText?: string;
          matchType?: string;
          impressions: number;
          clicks: number;
          cost: number;
          sales: number;
          orders: number;
        }>;

        const breakdown = reportData
          .filter(r => r.cost > 0 || r.sales > 0)
          .map(r => {
            const acos = r.sales > 0 ? (r.cost / r.sales) : null;
            const roas = r.cost > 0 ? (r.sales / r.cost) : null;
            const cpc = r.clicks > 0 ? (r.cost / r.clicks) : null;
            const ctr = r.impressions > 0 ? (r.clicks / r.impressions) : null;

            return {
              id: segmentField === 'campaignId' ? r.campaignId : segmentField === 'adGroupId' ? r.adGroupId : r.keywordId,
              name: segmentField === 'campaignId' ? r.campaignName : segmentField === 'adGroupId' ? r.adGroupName : r.keywordText,
              matchType: r.matchType,
              impressions: r.impressions,
              clicks: r.clicks,
              ctr: ctr ? (ctr * 100).toFixed(2) + '%' : 'N/A',
              cpc: cpc ? '$' + cpc.toFixed(2) : 'N/A',
              cost: '$' + r.cost.toFixed(2),
              sales: '$' + r.sales.toFixed(2),
              orders: r.orders,
              acos: acos ? (acos * 100).toFixed(2) + '%' : 'N/A',
              roas: roas ? roas.toFixed(2) : 'N/A',
            };
          })
          .sort((a, b) => {
            const acosA = a.acos === 'N/A' ? 999 : parseFloat(a.acos);
            const acosB = b.acos === 'N/A' ? 999 : parseFloat(b.acos);
            return acosA - acosB;
          });

        const totalSales = reportData.reduce((sum, r) => sum + r.sales, 0);
        const totalCost = reportData.reduce((sum, r) => sum + r.cost, 0);
        const overallAcos = totalSales > 0 ? (totalCost / totalSales) : 0;

        const profitable = breakdown.filter(b => b.acos !== 'N/A' && parseFloat(b.acos) < 30);
        const unprofitable = breakdown.filter(b => b.acos === 'N/A' || parseFloat(b.acos) > 50);

        return makeToolResponse({
          reportId: createResponse.reportId,
          period: { startDate: input.startDate, endDate: input.endDate },
          segment: input.segment,
          summary: {
            totalSegments: breakdown.length,
            totalSales: '$' + totalSales.toFixed(2),
            totalCost: '$' + totalCost.toFixed(2),
            overallAcos: (overallAcos * 100).toFixed(2) + '%',
            profitableSegments: profitable.length,
            unprofitableSegments: unprofitable.length,
          },
          breakdown,
          insights: [
            `${profitable.length} ${input.segment}(s) have ACoS < 30% (profitable)`,
            `${unprofitable.length} ${input.segment}(s) have ACoS > 50% or no sales (unprofitable)`,
            `Overall ACoS: ${(overallAcos * 100).toFixed(2)}%`,
            unprofitable.length > 0 
              ? `Consider optimizing or pausing ${unprofitable.length} unprofitable ${input.segment}(s)`
              : 'All segments are performing well',
          ],
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to calculate ACoS breakdown: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
