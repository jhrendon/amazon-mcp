import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../../client/ads-api-client.js';
import { makeToolResponse, ReportPoller } from 'amazon-mcp-common';

const identifyNegativeKeywordsSchema = z.object({
  campaignType: z.enum(['sp', 'sb']).describe('Campaign type (SP or SB only)'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Start date (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('End date (YYYY-MM-DD)'),
  minSpend: z.number().positive().optional().default(5).describe('Minimum spend threshold to consider'),
  maxOrders: z.number().min(0).optional().default(0).describe('Maximum orders threshold (0 = no sales)'),
});

export function registerNegativeKeywordTools(server: McpServer): void {
  server.registerTool(
    'identify_negative_keywords',
    {
      description: 'Identify search terms with high spend but no or low conversions. Returns candidates for negative keywords.',
      inputSchema: identifyNegativeKeywordsSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const endpoint = input.campaignType === 'sp'
          ? '/v2/sp/searchTerms/report'
          : '/v2/hs/searchTerms/report';

        const body = {
          startDate: input.startDate,
          endDate: input.endDate,
          metrics: ['impressions', 'clicks', 'cost', 'sales', 'orders'],
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
            : `/v2/hs/reports/${reportId}`,
          getDownloadPath: (reportId) => input.campaignType === 'sp'
            ? `/v2/sp/reports/${reportId}/download`
            : `/v2/hs/reports/${reportId}/download`,
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
        const outputPath = `${tempDir}/${input.campaignType}-search-terms-${createResponse.reportId}.json.gz`;

        await poller.downloadReport(createResponse.reportId, outputPath);

        const fs = await import('fs/promises');
        const zlib = await import('zlib');
        const compressed = await fs.readFile(outputPath);
        const decompressed = zlib.gunzipSync(compressed);
        const reportData = JSON.parse(decompressed.toString('utf-8')) as Array<{
          campaignId: number;
          campaignName?: string;
          adGroupId: number;
          adGroupName?: string;
          keywordId?: number;
          keywordText?: string;
          searchTerm: string;
          matchType: string;
          impressions: number;
          clicks: number;
          cost: number;
          sales: number;
          orders: number;
        }>;

        const candidates = reportData
          .filter(r => 
            r.cost >= input.minSpend && 
            r.orders <= input.maxOrders &&
            r.searchTerm &&
            r.searchTerm.trim().length > 0
          )
          .sort((a, b) => b.cost - a.cost)
          .slice(0, 50)
          .map(r => ({
            searchTerm: r.searchTerm,
            campaignId: r.campaignId,
            campaignName: r.campaignName,
            adGroupId: r.adGroupId,
            adGroupName: r.adGroupName,
            keywordText: r.keywordText,
            matchType: r.matchType,
            cost: r.cost.toFixed(2),
            sales: r.sales.toFixed(2),
            orders: r.orders,
            clicks: r.clicks,
            impressions: r.impressions,
          }));

        const totalWastedSpend = candidates.reduce((sum, c) => sum + parseFloat(c.cost), 0);

        return makeToolResponse({
          reportId: createResponse.reportId,
          period: { startDate: input.startDate, endDate: input.endDate },
          summary: {
            totalSearchTerms: reportData.length,
            negativeKeywordCandidates: candidates.length,
            totalWastedSpend: totalWastedSpend.toFixed(2),
          },
          candidates,
          recommendations: [
            `Found ${candidates.length} search terms with spend >= $${input.minSpend} and orders <= ${input.maxOrders}.`,
            `Total wasted spend: $${totalWastedSpend.toFixed(2)}`,
            'Consider adding these as negative keywords to reduce wasted ad spend.',
            'Review each term carefully before adding - some may be relevant but just not converting yet.',
          ],
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to identify negative keywords: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
