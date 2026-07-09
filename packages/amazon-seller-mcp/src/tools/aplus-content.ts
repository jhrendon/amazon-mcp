import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSPAPIClient } from '../client/sp-api-client.js';
import { makeToolResponse } from './_shared/response.js';
import { marketplaceIdSchema } from './_shared/schemas.js';
import { resolveMarketplaceId, validateMarketplaceId } from './_shared/marketplace.js';

const contentReferenceKeySchema = z.string().min(1).describe('Content reference key');

const contentDocumentSchema = z
  .object({
    name: z.string().optional().describe('Content document name'),
    contentType: z.enum(['EBC', 'EMC']).optional().describe('Content type'),
    contentModuleList: z.array(z.record(z.unknown())).optional().describe('Content module list'),
    languageTag: z.string().optional().describe('Language tag (e.g., en_US)'),
  })
  .passthrough()
  .describe('Content document object');

const searchContentDocumentsSchema = z.object({
  marketplaceId: marketplaceIdSchema.describe('Marketplace ID (required)'),
  pageToken: z.string().optional().describe('Pagination token'),
  locale: z.string().optional().describe('Locale filter'),
});

const createContentDocumentSchema = z.object({
  marketplaceId: marketplaceIdSchema.describe('Marketplace ID (required)'),
  contentDocument: contentDocumentSchema.describe('Content document to create'),
});

const getContentDocumentSchema = z.object({
  contentReferenceKey: contentReferenceKeySchema,
  marketplaceId: marketplaceIdSchema.describe('Marketplace ID (required)'),
  includedDataSet: z
    .enum(['CONTENTS', 'METADATA'])
    .optional()
    .describe('Data set to include: CONTENTS or METADATA'),
});

const updateContentDocumentSchema = z.object({
  contentReferenceKey: contentReferenceKeySchema,
  marketplaceId: marketplaceIdSchema.describe('Marketplace ID (required)'),
  contentDocument: contentDocumentSchema.describe('Content document to update'),
});

const listContentDocumentAsinRelationsSchema = z.object({
  contentReferenceKey: contentReferenceKeySchema,
  marketplaceId: marketplaceIdSchema.describe('Marketplace ID (required)'),
  includedDataSet: z.enum(['METADATA']).optional().describe('Data set to include'),
  pageToken: z.string().optional().describe('Pagination token'),
});

const postContentDocumentAsinRelationsSchema = z.object({
  contentReferenceKey: contentReferenceKeySchema,
  marketplaceId: marketplaceIdSchema.describe('Marketplace ID (required)'),
  asinSet: z.array(z.string().min(1)).min(1).describe('List of ASINs to associate'),
});

const validateContentDocumentAsinRelationsSchema = z.object({
  marketplaceId: marketplaceIdSchema.describe('Marketplace ID (required)'),
  asinSet: z.array(z.string().min(1)).min(1).describe('List of ASINs to validate'),
  contentDocument: contentDocumentSchema.describe('Content document to validate against'),
});

const searchContentPublishRecordsSchema = z.object({
  marketplaceId: marketplaceIdSchema.describe('Marketplace ID (required)'),
  asinSet: z.array(z.string().min(1)).optional().describe('Filter by ASINs'),
  pageToken: z.string().optional().describe('Pagination token'),
});

const postContentDocumentApprovalSubmissionSchema = z.object({
  contentReferenceKey: contentReferenceKeySchema,
  marketplaceId: marketplaceIdSchema.describe('Marketplace ID (required)'),
});

const postContentDocumentSuspendSubmissionSchema = z.object({
  contentReferenceKey: contentReferenceKeySchema,
  marketplaceId: marketplaceIdSchema.describe('Marketplace ID (required)'),
});

export function registerAplusContentTools(server: McpServer): void {
  server.registerTool(
    'search_content_documents',
    {
      description:
        'Search for A+ content documents in the marketplace. Returns a list of content documents with metadata.',
      inputSchema: searchContentDocumentsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const queryParams: Record<string, unknown> = {
        marketplaceId,
      };
      if (input.pageToken) queryParams.pageToken = input.pageToken;
      if (input.locale) queryParams.locale = input.locale;

      const response = await client.get(
        '/aplus/2020-11-01/contentDocuments',
        queryParams,
        { rateLimitCategory: 'aplusContent' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'create_content_document',
    {
      description:
        'Create an A+ content document. Returns the created content document reference.',
      inputSchema: createContentDocumentSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const body: Record<string, unknown> = {
        contentDocument: input.contentDocument,
      };

      const response = await client.post(
        '/aplus/2020-11-01/contentDocuments',
        body,
        { rateLimitCategory: 'aplusContent' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_content_document',
    {
      description:
        'Get an A+ content document by content reference key. Returns the document contents and/or metadata.',
      inputSchema: getContentDocumentSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const queryParams: Record<string, unknown> = {
        marketplaceId,
      };
      if (input.includedDataSet) queryParams.includedDataSet = input.includedDataSet;

      const response = await client.get(
        `/aplus/2020-11-01/contentDocuments/${encodeURIComponent(input.contentReferenceKey)}`,
        queryParams,
        { rateLimitCategory: 'aplusContent' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'update_content_document',
    {
      description:
        'Update an existing A+ content document. Returns the updated content document reference.',
      inputSchema: updateContentDocumentSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const body: Record<string, unknown> = {
        contentDocument: input.contentDocument,
      };

      const response = await client.post(
        `/aplus/2020-11-01/contentDocuments/${encodeURIComponent(input.contentReferenceKey)}`,
        body,
        { rateLimitCategory: 'aplusContent' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'list_content_document_asin_relations',
    {
      description:
        'List ASINs associated with an A+ content document. Returns the ASIN relations for the content.',
      inputSchema: listContentDocumentAsinRelationsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const queryParams: Record<string, unknown> = {
        marketplaceId,
      };
      if (input.includedDataSet) queryParams.includedDataSet = input.includedDataSet;
      if (input.pageToken) queryParams.pageToken = input.pageToken;

      const response = await client.get(
        `/aplus/2020-11-01/contentDocuments/${encodeURIComponent(input.contentReferenceKey)}/asins`,
        queryParams,
        { rateLimitCategory: 'aplusContent' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'post_content_document_asin_relations',
    {
      description:
        'Set or replace the ASINs associated with an A+ content document.',
      inputSchema: postContentDocumentAsinRelationsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const body: Record<string, unknown> = {
        asinSet: input.asinSet,
      };

      const response = await client.post(
        `/aplus/2020-11-01/contentDocuments/${encodeURIComponent(input.contentReferenceKey)}/asins`,
        body,
        { rateLimitCategory: 'aplusContent' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'validate_content_document_asin_relations',
    {
      description:
        'Validate whether ASINs can be associated with an A+ content document. Returns validation results without making changes.',
      inputSchema: validateContentDocumentAsinRelationsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const body: Record<string, unknown> = {
        asinSet: input.asinSet,
        contentDocument: input.contentDocument,
      };

      const response = await client.post(
        '/aplus/2020-11-01/contentAsinValidations',
        body,
        { rateLimitCategory: 'aplusContent' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'search_content_publish_records',
    {
      description:
        'Search for A+ content publish records by marketplace and optionally by ASIN. Returns publish record metadata.',
      inputSchema: searchContentPublishRecordsSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const queryParams: Record<string, unknown> = {
        marketplaceId,
      };
      if (input.asinSet) queryParams.asinSet = input.asinSet;
      if (input.pageToken) queryParams.pageToken = input.pageToken;

      const response = await client.get(
        '/aplus/2020-11-01/contentPublishRecords',
        queryParams,
        { rateLimitCategory: 'aplusContent' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'post_content_document_approval_submission',
    {
      description:
        'Submit an A+ content document for approval. The content must be approved before it can be published.',
      inputSchema: postContentDocumentApprovalSubmissionSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const body: Record<string, unknown> = {
        marketplaceId,
      };

      const response = await client.post(
        `/aplus/2020-11-01/contentDocuments/${encodeURIComponent(input.contentReferenceKey)}/approvalSubmissions`,
        body,
        { rateLimitCategory: 'aplusContent' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'post_content_document_suspend_submission',
    {
      description:
        'Suspend a published A+ content document. This removes the content from the associated ASINs.',
      inputSchema: postContentDocumentSuspendSubmissionSchema,
    },
    async (input) => {
      const client = getSPAPIClient();
      const marketplaceId = resolveMarketplaceId(input.marketplaceId);
      validateMarketplaceId(marketplaceId);

      const body: Record<string, unknown> = {
        marketplaceId,
      };

      const response = await client.post(
        `/aplus/2020-11-01/contentDocuments/${encodeURIComponent(input.contentReferenceKey)}/suspendSubmissions`,
        body,
        { rateLimitCategory: 'aplusContent' }
      );

      return makeToolResponse(response);
    }
  );
}
