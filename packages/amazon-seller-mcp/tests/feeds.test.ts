import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn();
const postMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('../src/client/sp-api-client.js', () => ({
  getSPAPIClient: () => ({
    get: getMock,
    post: postMock,
    delete: deleteMock,
  }),
}));

import { registerFeedsTools } from '../src/tools/feeds.js';
import { setParticipatingMarketplaceIds } from '../src/tools/_shared/marketplace.js';

function makeServer() {
  const tools: Record<string, { handler: (input: unknown) => Promise<unknown>; schema: unknown }> = {};
  const server = {
    registerTool: (name: string, opts: { inputSchema: unknown }, handler: (input: unknown) => Promise<unknown>) => {
      tools[name] = { handler, schema: opts.inputSchema };
      return server;
    },
  };
  return { server, tools };
}

describe('feeds tools', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    deleteMock.mockReset();
    setParticipatingMarketplaceIds(['ATVPDKIKX0DER']);
  });

  describe('get_feeds', () => {
    it('returns feeds list with no params', async () => {
      const apiResponse = {
        feeds: [
          { feedId: 'feed-1', feedType: 'POST_PRODUCT_DATA', processingStatus: 'DONE' },
          { feedId: 'feed-2', feedType: 'POST_INVENTORY_AVAILABILITY_DATA', processingStatus: 'IN_PROGRESS' },
        ],
        nextToken: 'tok-abc',
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFeedsTools(server);
      const handler = tools['get_feeds'].handler;

      const result = (await handler({})) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/feeds/2021-06-30/feeds',
        undefined,
        expect.objectContaining({ rateLimitCategory: 'feeds' })
      );
      expect(result.structuredContent.feeds).toHaveLength(2);
      expect(result.structuredContent.nextToken).toBe('tok-abc');
    });

    it('passes filter params as comma-separated strings', async () => {
      getMock.mockResolvedValue({ feeds: [] });

      const { server, tools } = makeServer();
      registerFeedsTools(server);
      const handler = tools['get_feeds'].handler;

      await handler({
        feedTypes: ['POST_PRODUCT_DATA', 'POST_INVENTORY_AVAILABILITY_DATA'],
        processingStatuses: ['DONE', 'IN_PROGRESS'],
        marketplaceIds: ['ATVPDKIKX0DER'],
        pageSize: 10,
        createdSince: '2025-01-01T00:00:00Z',
        createdUntil: '2025-06-01T00:00:00Z',
        nextToken: 'tok-xyz',
      });

      expect(getMock).toHaveBeenCalledWith(
        '/feeds/2021-06-30/feeds',
        expect.objectContaining({
          feedTypes: 'POST_PRODUCT_DATA,POST_INVENTORY_AVAILABILITY_DATA',
          processingStatuses: 'DONE,IN_PROGRESS',
          marketplaceIds: 'ATVPDKIKX0DER',
          pageSize: 10,
          createdSince: '2025-01-01T00:00:00Z',
          createdUntil: '2025-06-01T00:00:00Z',
          nextToken: 'tok-xyz',
        }),
        expect.objectContaining({ rateLimitCategory: 'feeds' })
      );
    });
  });

  describe('get_feed', () => {
    it('returns feed details by feedId', async () => {
      const apiResponse = {
        feedId: 'feed-123',
        feedType: 'POST_PRODUCT_DATA',
        processingStatus: 'DONE',
        marketplaceIds: ['ATVPDKIKX0DER'],
        createdTime: '2025-01-15T10:00:00Z',
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFeedsTools(server);
      const handler = tools['get_feed'].handler;

      const result = (await handler({ feedId: 'feed-123' })) as {
        structuredContent: typeof apiResponse;
      };

      expect(getMock).toHaveBeenCalledWith(
        '/feeds/2021-06-30/feeds/feed-123',
        undefined,
        expect.objectContaining({ rateLimitCategory: 'feeds' })
      );
      expect(result.structuredContent.feedId).toBe('feed-123');
      expect(result.structuredContent.processingStatus).toBe('DONE');
    });
  });

  describe('create_feed', () => {
    it('creates a feed and returns feedId', async () => {
      const apiResponse = { feedId: 'feed-new' };
      postMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFeedsTools(server);
      const handler = tools['create_feed'].handler;

      const result = (await handler({
        feedType: 'POST_PRODUCT_DATA',
        marketplaceIds: ['ATVPDKIKX0DER'],
        inputFeedDocumentId: 'doc-123',
      })) as { structuredContent: typeof apiResponse };

      expect(postMock).toHaveBeenCalledWith(
        '/feeds/2021-06-30/feeds',
        expect.objectContaining({
          feedType: 'POST_PRODUCT_DATA',
          marketplaceIds: ['ATVPDKIKX0DER'],
          inputFeedDocumentId: 'doc-123',
        }),
        expect.objectContaining({ rateLimitCategory: 'feeds' })
      );
      expect(result.structuredContent.feedId).toBe('feed-new');
    });

    it('includes feedOptions when provided', async () => {
      postMock.mockResolvedValue({ feedId: 'feed-opt' });

      const { server, tools } = makeServer();
      registerFeedsTools(server);
      const handler = tools['create_feed'].handler;

      await handler({
        feedType: 'POST_PRODUCT_DATA',
        marketplaceIds: ['ATVPDKIKX0DER'],
        inputFeedDocumentId: 'doc-456',
        feedOptions: { key1: 'value1' },
      });

      expect(postMock).toHaveBeenCalledWith(
        '/feeds/2021-06-30/feeds',
        expect.objectContaining({
          feedOptions: { key1: 'value1' },
        }),
        expect.any(Object)
      );
    });

    it('rejects missing required fields via zod', () => {
      const { server, tools } = makeServer();
      registerFeedsTools(server);
      const schema = tools['create_feed'].schema as { parse: (v: unknown) => unknown };
      expect(() =>
        schema.parse({ feedType: '', marketplaceIds: [], inputFeedDocumentId: '' })
      ).toThrow();
    });
  });

  describe('cancel_feed', () => {
    it('calls DELETE and returns success', async () => {
      deleteMock.mockResolvedValue(undefined);

      const { server, tools } = makeServer();
      registerFeedsTools(server);
      const handler = tools['cancel_feed'].handler;

      const result = (await handler({ feedId: 'feed-cancel' })) as {
        structuredContent: { success: boolean; feedId: string };
      };

      expect(deleteMock).toHaveBeenCalledWith(
        '/feeds/2021-06-30/feeds/feed-cancel',
        undefined,
        expect.objectContaining({ rateLimitCategory: 'feeds' })
      );
      expect(result.structuredContent.success).toBe(true);
      expect(result.structuredContent.feedId).toBe('feed-cancel');
    });
  });

  describe('create_feed_document', () => {
    it('creates a feed document and returns encryption details', async () => {
      const apiResponse = {
        feedDocumentId: 'doc-new',
        url: 'https://example.com/upload',
        encryptionDetails: {
          standard: 'AES',
          initializationVector: 'iv123',
          key: 'key456',
        },
      };
      postMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFeedsTools(server);
      const handler = tools['create_feed_document'].handler;

      const result = (await handler({ contentType: 'text/tab-separated-values' })) as {
        structuredContent: typeof apiResponse;
      };

      expect(postMock).toHaveBeenCalledWith(
        '/feeds/2021-06-30/documents',
        { contentType: 'text/tab-separated-values' },
        expect.objectContaining({ rateLimitCategory: 'feeds' })
      );
      expect(result.structuredContent.feedDocumentId).toBe('doc-new');
      expect(result.structuredContent.encryptionDetails.standard).toBe('AES');
    });
  });

  describe('get_feed_document', () => {
    it('returns feed document details', async () => {
      const apiResponse = {
        feedDocumentId: 'doc-789',
        url: 'https://example.com/download',
        compressionAlgorithm: 'GZIP',
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerFeedsTools(server);
      const handler = tools['get_feed_document'].handler;

      const result = (await handler({ feedDocumentId: 'doc-789' })) as {
        structuredContent: typeof apiResponse;
      };

      expect(getMock).toHaveBeenCalledWith(
        '/feeds/2021-06-30/documents/doc-789',
        undefined,
        expect.objectContaining({ rateLimitCategory: 'feeds' })
      );
      expect(result.structuredContent.feedDocumentId).toBe('doc-789');
      expect(result.structuredContent.compressionAlgorithm).toBe('GZIP');
    });
  });
});
