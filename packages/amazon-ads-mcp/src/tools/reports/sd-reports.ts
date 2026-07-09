import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdsAPIClient, AdsAPIError } from '../../client/ads-api-client.js';
import { makeToolResponse, ReportPoller } from 'amazon-mcp-common';
import type { ReportResponse, ReportStatusResponse } from '../../types/reports.js';

const createReportSchema = z.object({
  reportType: z.enum(['sdCampaigns', 'sdAdGroups', 'sdTargets'])
    .describe('Type of report to create'),
  reportDate: z.string().optional().describe('Report date in YYYYMMDD format'),
  segment: z.enum(['campaign', 'adGroup', 'target']).optional()
    .describe('Segment for the report'),
  metrics: z.array(z.string()).optional()
    .describe('List of metrics to include'),
});

const getReportStatusSchema = z.object({
  reportId: z.string().describe('The report ID to check status for'),
});

const downloadReportSchema = z.object({
  reportId: z.string().describe('The report ID to download'),
  outputPath: z.string().optional().describe('Optional output file path'),
});

const readReportSchema = z.object({
  reportType: z.enum(['sdCampaigns', 'sdAdGroups', 'sdTargets'])
    .describe('Type of report to read'),
  reportDate: z.string().optional().describe('Report date in YYYYMMDD format'),
  segment: z.enum(['campaign', 'adGroup', 'target']).optional()
    .describe('Segment for the report'),
  metrics: z.array(z.string()).optional()
    .describe('List of metrics to include'),
  maxWaitMs: z.number().optional().default(300000)
    .describe('Maximum time to wait for report completion'),
});

export function registerSDReportTools(server: McpServer): void {
  server.registerTool(
    'sd_create_report',
    {
      description: 'Create a Sponsored Display report. Returns a reportId.',
      inputSchema: createReportSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const endpoint = `/sd/${input.reportType.toLowerCase()}/report`;
        
        const body: Record<string, unknown> = {};
        if (input.reportDate) body.reportDate = input.reportDate;
        if (input.segment) body.segment = input.segment;
        if (input.metrics) body.metrics = input.metrics;

        const response = await client.post<ReportResponse>(
          endpoint,
          body,
          { rateLimitCategory: 'reports' }
        );

        return makeToolResponse({
          reportId: response.reportId,
          recordId: response.recordId,
          message: 'Report created successfully. Use sd_get_report_status to check progress.',
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to create SD report: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sd_get_report_status',
    {
      description: 'Check the status of a Sponsored Display report.',
      inputSchema: getReportStatusSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const response = await client.get<ReportStatusResponse>(
          `/sd/reports/${input.reportId}`,
          undefined,
          { rateLimitCategory: 'reports' }
        );

        return makeToolResponse({
          reportId: response.reportId,
          status: response.status,
          statusDetails: response.statusDetails,
          location: response.location,
          fileSize: response.fileSize,
          message: response.status === 'DONE' 
            ? 'Report is ready to download. Use sd_download_report.'
            : response.status === 'FAILURE'
            ? 'Report generation failed.'
            : 'Report is still being generated.',
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to get SD report status: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sd_download_report',
    {
      description: 'Download a completed Sponsored Display report.',
      inputSchema: downloadReportSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const tempDir = process.env.TEMP || process.env.TMP || '/tmp';
        const outputPath = input.outputPath || `${tempDir}/sd-report-${input.reportId}.json.gz`;

        await client.download(
          `/sd/reports/${input.reportId}/download`,
          outputPath,
          { rateLimitCategory: 'reports' }
        );

        return makeToolResponse({
          reportId: input.reportId,
          outputPath,
          message: 'Report downloaded successfully.',
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to download SD report: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerTool(
    'sd_read_report',
    {
      description: 'Create, wait for, and read a Sponsored Display report in one operation.',
      inputSchema: readReportSchema,
    },
    async (input) => {
      const client = getAdsAPIClient();

      try {
        const endpoint = `/sd/${input.reportType.toLowerCase()}/report`;
        
        const body: Record<string, unknown> = {};
        if (input.reportDate) body.reportDate = input.reportDate;
        if (input.segment) body.segment = input.segment;
        if (input.metrics) body.metrics = input.metrics;

        const createResponse = await client.post<ReportResponse>(
          endpoint,
          body,
          { rateLimitCategory: 'reports' }
        );

        const poller = new ReportPoller({
          client,
          getStatusPath: (reportId) => `/sd/reports/${reportId}`,
          getDownloadPath: (reportId) => `/sd/reports/${reportId}/download`,
        });

        const status = await poller.waitForCompletion(createResponse.reportId, {
          maxWaitMs: input.maxWaitMs,
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
        const outputPath = `${tempDir}/sd-report-${createResponse.reportId}.json.gz`;

        await poller.downloadReport(createResponse.reportId, outputPath);

        const fs = await import('fs/promises');
        const zlib = await import('zlib');
        const compressed = await fs.readFile(outputPath);
        const decompressed = zlib.gunzipSync(compressed);
        const reportData = JSON.parse(decompressed.toString('utf-8'));

        return makeToolResponse({
          reportId: createResponse.reportId,
          recordId: createResponse.recordId,
          data: reportData,
          recordCount: Array.isArray(reportData) ? reportData.length : 0,
          message: 'Report generated and read successfully.',
        });
      } catch (error) {
        if (error instanceof AdsAPIError) throw error;
        throw new AdsAPIError(`Failed to read SD report: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
