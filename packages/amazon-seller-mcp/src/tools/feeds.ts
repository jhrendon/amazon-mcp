import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSPAPIClient } from '../client/sp-api-client.js';
import { makeToolResponse } from './_shared/response.js';
import type {
  GetFeedsResponse,
  Feed,
  CreateFeedResponse,
  CreateFeedDocumentResponse,
  GetFeedDocumentResponse,
} from '../types/sp-api.js';

const getFeedsSchema = z.object({
  feedTypes: z
    .array(z.string())
    .optional()
    .describe('Filter by feed types'),
  processingStatuses: z
    .array(z.enum(['CANCELLED', 'DONE', 'FATAL', 'IN_PROGRESS', 'IN_QUEUE']))
    .optional()
    .describe('Filter by processing status'),
  marketplaceIds: z
    .array(z.string())
    .optional()
    .describe('Filter by marketplace IDs'),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Maximum results per page (max 100)'),
  createdSince: z
    .string()
    .optional()
    .describe('ISO 8601 date - feeds created after this date'),
  createdUntil: z
    .string()
    .optional()
    .describe('ISO 8601 date - feeds created before this date'),
  nextToken: z
    .string()
    .optional()
    .describe('Pagination token'),
});

const getFeedSchema = z.object({
  feedId: z.string().min(1).describe('The feed ID to retrieve'),
});

const createFeedSchema = z.object({
  feedType: z.string().min(1).describe('The feed type (e.g., POST_PRODUCT_DATA)'),
  marketplaceIds: z
    .array(z.string().min(1))
    .min(1)
    .describe('Marketplace IDs to submit the feed to'),
  inputFeedDocumentId: z
    .string()
    .min(1)
    .describe('The document ID returned by create_feed_document'),
  feedOptions: z
    .record(z.string())
    .optional()
    .describe('Additional feed options as key-value pairs'),
});

const cancelFeedSchema = z.object({
  feedId: z.string().min(1).describe('The feed ID to cancel'),
});

const createFeedDocumentSchema = z.object({
  contentType: z
    .string()
    .min(1)
    .describe('Content type of the feed document (e.g., "text/tab-separated-values")'),
});

const getFeedDocumentSchema = z.object({
  feedDocumentId: z.string().min(1).describe('The feed document ID to retrieve'),
});

export function registerFeedsTools(server: McpServer): void {
  server.registerTool(
    'get_feeds',
    {
      description:
        'Get a list of feeds. Supports filtering by feed type, processing status, marketplace, and date range.',
      inputSchema: getFeedsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const params: Record<string, unknown> = {};
      if (input.feedTypes) params.feedTypes = input.feedTypes.join(',');
      if (input.processingStatuses) params.processingStatuses = input.processingStatuses.join(',');
      if (input.marketplaceIds) params.marketplaceIds = input.marketplaceIds.join(',');
      if (input.pageSize) params.pageSize = input.pageSize;
      if (input.createdSince) params.createdSince = input.createdSince;
      if (input.createdUntil) params.createdUntil = input.createdUntil;
      if (input.nextToken) params.nextToken = input.nextToken;

      const response = await client.get<GetFeedsResponse>(
        '/feeds/2021-06-30/feeds',
        Object.keys(params).length > 0 ? params : undefined,
        { rateLimitCategory: 'feeds' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_feed',
    {
      description: 'Get detailed information about a specific feed by feed ID.',
      inputSchema: getFeedSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const response = await client.get<Feed>(
        `/feeds/2021-06-30/feeds/${encodeURIComponent(input.feedId)}`,
        undefined,
        { rateLimitCategory: 'feeds' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'create_feed',
    {
      description:
        'Create a feed. Submit feed data to Amazon for processing. Use create_feed_document first to get an inputFeedDocumentId.',
      inputSchema: createFeedSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const body: Record<string, unknown> = {
        feedType: input.feedType,
        marketplaceIds: input.marketplaceIds,
        inputFeedDocumentId: input.inputFeedDocumentId,
      };
      if (input.feedOptions) body.feedOptions = input.feedOptions;

      const response = await client.post<CreateFeedResponse>(
        '/feeds/2021-06-30/feeds',
        body,
        { rateLimitCategory: 'feeds' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'cancel_feed',
    {
      description: 'Cancel a feed that is in IN_PROGRESS or IN_QUEUE status.',
      inputSchema: cancelFeedSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      await client.delete(
        `/feeds/2021-06-30/feeds/${encodeURIComponent(input.feedId)}`,
        undefined,
        { rateLimitCategory: 'feeds' }
      );

      return makeToolResponse({ success: true, feedId: input.feedId });
    }
  );

  server.registerTool(
    'create_feed_document',
    {
      description:
        'Create a feed document. Returns a presigned URL to upload feed content and a feedDocumentId to use with create_feed.',
      inputSchema: createFeedDocumentSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const response = await client.post<CreateFeedDocumentResponse>(
        '/feeds/2021-06-30/documents',
        { contentType: input.contentType },
        { rateLimitCategory: 'feeds' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_feed_document',
    {
      description:
        'Get a feed document. Returns a presigned URL to download the feed document content.',
      inputSchema: getFeedDocumentSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const response = await client.get<GetFeedDocumentResponse>(
        `/feeds/2021-06-30/documents/${encodeURIComponent(input.feedDocumentId)}`,
        undefined,
        { rateLimitCategory: 'feeds' }
      );

      return makeToolResponse(response);
    }
  );
}
