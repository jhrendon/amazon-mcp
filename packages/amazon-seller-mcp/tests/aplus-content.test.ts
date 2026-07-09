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

import { registerAplusContentTools } from '../src/tools/aplus-content.js';
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

describe('aplus-content tools', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    deleteMock.mockReset();
    setParticipatingMarketplaceIds(['ATVPDKIKX0DER']);
  });

  describe('search_content_documents', () => {
    it('calls the correct endpoint with marketplaceId', async () => {
      const apiResponse = { contentReferenceKeys: ['key-1', 'key-2'], nextPageToken: 'tok-abc' };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerAplusContentTools(server);
      const handler = tools['search_content_documents'].handler;

      const result = (await handler({
        marketplaceId: 'ATVPDKIKX0DER',
      })) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/aplus/2020-11-01/contentDocuments',
        expect.objectContaining({ marketplaceId: 'ATVPDKIKX0DER' }),
        expect.objectContaining({ rateLimitCategory: 'aplusContent' })
      );
      expect(result.structuredContent.contentReferenceKeys).toHaveLength(2);
    });

    it('passes optional pageToken and locale params', async () => {
      getMock.mockResolvedValue({ contentReferenceKeys: [] });

      const { server, tools } = makeServer();
      registerAplusContentTools(server);
      const handler = tools['search_content_documents'].handler;

      await handler({
        marketplaceId: 'ATVPDKIKX0DER',
        pageToken: 'tok-xyz',
        locale: 'en_US',
      });

      expect(getMock).toHaveBeenCalledWith(
        '/aplus/2020-11-01/contentDocuments',
        expect.objectContaining({ pageToken: 'tok-xyz', locale: 'en_US' }),
        expect.any(Object)
      );
    });
  });

  describe('create_content_document', () => {
    it('posts content document to the correct endpoint', async () => {
      const apiResponse = { contentReferenceKey: 'new-key-1' };
      postMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerAplusContentTools(server);
      const handler = tools['create_content_document'].handler;

      const contentDocument = { name: 'My A+ Content', contentType: 'EBC', contentModuleList: [] };
      const result = (await handler({
        marketplaceId: 'ATVPDKIKX0DER',
        contentDocument,
      })) as { structuredContent: typeof apiResponse };

      expect(postMock).toHaveBeenCalledWith(
        '/aplus/2020-11-01/contentDocuments',
        expect.objectContaining({ contentDocument }),
        expect.objectContaining({ rateLimitCategory: 'aplusContent' })
      );
      expect(result.structuredContent.contentReferenceKey).toBe('new-key-1');
    });
  });

  describe('get_content_document', () => {
    it('calls the correct endpoint with contentReferenceKey in path', async () => {
      const apiResponse = { contentReferenceKey: 'key-123', contentDocument: { name: 'Test' } };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerAplusContentTools(server);
      const handler = tools['get_content_document'].handler;

      const result = (await handler({
        contentReferenceKey: 'key-123',
        marketplaceId: 'ATVPDKIKX0DER',
        includedDataSet: 'CONTENTS',
      })) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/aplus/2020-11-01/contentDocuments/key-123',
        expect.objectContaining({
          marketplaceId: 'ATVPDKIKX0DER',
          includedDataSet: 'CONTENTS',
        }),
        expect.objectContaining({ rateLimitCategory: 'aplusContent' })
      );
      expect(result.structuredContent.contentReferenceKey).toBe('key-123');
    });
  });

  describe('update_content_document', () => {
    it('posts updated content document to the correct path', async () => {
      const apiResponse = { contentReferenceKey: 'key-123' };
      postMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerAplusContentTools(server);
      const handler = tools['update_content_document'].handler;

      const contentDocument = { name: 'Updated Content' };
      await handler({
        contentReferenceKey: 'key-123',
        marketplaceId: 'ATVPDKIKX0DER',
        contentDocument,
      });

      expect(postMock).toHaveBeenCalledWith(
        '/aplus/2020-11-01/contentDocuments/key-123',
        expect.objectContaining({ contentDocument }),
        expect.objectContaining({ rateLimitCategory: 'aplusContent' })
      );
    });
  });

  describe('list_content_document_asin_relations', () => {
    it('calls the correct endpoint with contentReferenceKey in path', async () => {
      const apiResponse = { asinList: ['B001', 'B002'] };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerAplusContentTools(server);
      const handler = tools['list_content_document_asin_relations'].handler;

      const result = (await handler({
        contentReferenceKey: 'key-456',
        marketplaceId: 'ATVPDKIKX0DER',
      })) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/aplus/2020-11-01/contentDocuments/key-456/asins',
        expect.objectContaining({ marketplaceId: 'ATVPDKIKX0DER' }),
        expect.objectContaining({ rateLimitCategory: 'aplusContent' })
      );
      expect(result.structuredContent.asinList).toHaveLength(2);
    });

    it('passes optional includedDataSet and pageToken', async () => {
      getMock.mockResolvedValue({ asinList: [] });

      const { server, tools } = makeServer();
      registerAplusContentTools(server);
      const handler = tools['list_content_document_asin_relations'].handler;

      await handler({
        contentReferenceKey: 'key-789',
        marketplaceId: 'ATVPDKIKX0DER',
        includedDataSet: 'METADATA',
        pageToken: 'page-2',
      });

      expect(getMock).toHaveBeenCalledWith(
        '/aplus/2020-11-01/contentDocuments/key-789/asins',
        expect.objectContaining({ includedDataSet: 'METADATA', pageToken: 'page-2' }),
        expect.any(Object)
      );
    });
  });

  describe('post_content_document_asin_relations', () => {
    it('posts asinSet to the correct path', async () => {
      postMock.mockResolvedValue(undefined);

      const { server, tools } = makeServer();
      registerAplusContentTools(server);
      const handler = tools['post_content_document_asin_relations'].handler;

      await handler({
        contentReferenceKey: 'key-asins',
        marketplaceId: 'ATVPDKIKX0DER',
        asinSet: ['B001', 'B002', 'B003'],
      });

      expect(postMock).toHaveBeenCalledWith(
        '/aplus/2020-11-01/contentDocuments/key-asins/asins',
        expect.objectContaining({ asinSet: ['B001', 'B002', 'B003'] }),
        expect.objectContaining({ rateLimitCategory: 'aplusContent' })
      );
    });
  });

  describe('validate_content_document_asin_relations', () => {
    it('posts validation request to the contentAsinValidations endpoint', async () => {
      const apiResponse = { validationResults: [{ asin: 'B001', valid: true }] };
      postMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerAplusContentTools(server);
      const handler = tools['validate_content_document_asin_relations'].handler;

      const contentDocument = { name: 'Test Doc' };
      const result = (await handler({
        marketplaceId: 'ATVPDKIKX0DER',
        asinSet: ['B001', 'B002'],
        contentDocument,
      })) as { structuredContent: typeof apiResponse };

      expect(postMock).toHaveBeenCalledWith(
        '/aplus/2020-11-01/contentAsinValidations',
        expect.objectContaining({ asinSet: ['B001', 'B002'], contentDocument }),
        expect.objectContaining({ rateLimitCategory: 'aplusContent' })
      );
      expect(result.structuredContent.validationResults).toHaveLength(1);
    });
  });

  describe('search_content_publish_records', () => {
    it('calls the correct endpoint with marketplaceId', async () => {
      const apiResponse = { contentPublishRecords: [{ asin: 'B001' }] };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerAplusContentTools(server);
      const handler = tools['search_content_publish_records'].handler;

      const result = (await handler({
        marketplaceId: 'ATVPDKIKX0DER',
      })) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/aplus/2020-11-01/contentPublishRecords',
        expect.objectContaining({ marketplaceId: 'ATVPDKIKX0DER' }),
        expect.objectContaining({ rateLimitCategory: 'aplusContent' })
      );
      expect(result.structuredContent.contentPublishRecords).toHaveLength(1);
    });

    it('passes optional asinSet and pageToken', async () => {
      getMock.mockResolvedValue({ contentPublishRecords: [] });

      const { server, tools } = makeServer();
      registerAplusContentTools(server);
      const handler = tools['search_content_publish_records'].handler;

      await handler({
        marketplaceId: 'ATVPDKIKX0DER',
        asinSet: ['B001'],
        pageToken: 'tok-next',
      });

      expect(getMock).toHaveBeenCalledWith(
        '/aplus/2020-11-01/contentPublishRecords',
        expect.objectContaining({ asinSet: ['B001'], pageToken: 'tok-next' }),
        expect.any(Object)
      );
    });
  });

  describe('post_content_document_approval_submission', () => {
    it('posts to the approvalSubmissions endpoint', async () => {
      postMock.mockResolvedValue(undefined);

      const { server, tools } = makeServer();
      registerAplusContentTools(server);
      const handler = tools['post_content_document_approval_submission'].handler;

      await handler({
        contentReferenceKey: 'key-approve',
        marketplaceId: 'ATVPDKIKX0DER',
      });

      expect(postMock).toHaveBeenCalledWith(
        '/aplus/2020-11-01/contentDocuments/key-approve/approvalSubmissions',
        expect.objectContaining({ marketplaceId: 'ATVPDKIKX0DER' }),
        expect.objectContaining({ rateLimitCategory: 'aplusContent' })
      );
    });
  });

  describe('post_content_document_suspend_submission', () => {
    it('posts to the suspendSubmissions endpoint', async () => {
      postMock.mockResolvedValue(undefined);

      const { server, tools } = makeServer();
      registerAplusContentTools(server);
      const handler = tools['post_content_document_suspend_submission'].handler;

      await handler({
        contentReferenceKey: 'key-suspend',
        marketplaceId: 'ATVPDKIKX0DER',
      });

      expect(postMock).toHaveBeenCalledWith(
        '/aplus/2020-11-01/contentDocuments/key-suspend/suspendSubmissions',
        expect.objectContaining({ marketplaceId: 'ATVPDKIKX0DER' }),
        expect.objectContaining({ rateLimitCategory: 'aplusContent' })
      );
    });
  });
});
