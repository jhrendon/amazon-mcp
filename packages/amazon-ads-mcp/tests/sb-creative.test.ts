import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('../src/client/ads-api-client.js', () => ({
  getAdsAPIClient: () => ({
    get: getMock,
    post: postMock,
    put: putMock,
    delete: deleteMock,
  }),
  AdsAPIError: class AdsAPIError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number) {
      super(message);
      this.name = 'AdsAPIError';
      this.statusCode = statusCode ?? 500;
    }
  },
}));

import { registerSBCreativeTools } from '../src/tools/sb-creative.js';

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

describe('sb creative tools', () => {
  let tools: Record<string, { handler: (input: unknown) => Promise<unknown>; schema: unknown }>;

  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
    const { server, tools: t } = makeServer();
    registerSBCreativeTools(server as any);
    tools = t;
  });

  describe('sb_list_stores', () => {
    it('should call correct endpoint with no params', async () => {
      const mockStores = { stores: [{ storePageId: '1', storeName: 'Test Store' }], count: 1 };
      getMock.mockResolvedValue(mockStores);

      const result = await tools['sb_list_stores'].handler({});

      expect(getMock).toHaveBeenCalledWith(
        '/stores/v0/stores',
        undefined,
        { rateLimitCategory: 'sbStores' }
      );
      expect(result).toMatchObject({
        structuredContent: { stores: mockStores.stores, count: 1 },
      });
    });
  });

  describe('sb_get_store', () => {
    it('should call correct endpoint with brandEntityId', async () => {
      const mockStore = { storePageId: '1', storeName: 'Test Store', brandEntityId: 'ENTITY123' };
      getMock.mockResolvedValue(mockStore);

      const result = await tools['sb_get_store'].handler({ brandEntityId: 'ENTITY123' });

      expect(getMock).toHaveBeenCalledWith(
        '/stores/v0/stores/ENTITY123',
        undefined,
        { rateLimitCategory: 'sbStores' }
      );
      expect(result).toMatchObject({
        structuredContent: mockStore,
      });
    });
  });

  describe('sb_get_store_asin_list', () => {
    it('should call correct endpoint with brandEntityId', async () => {
      const mockAsins = { asins: ['B001', 'B002'], brandEntityId: 'ENTITY123' };
      getMock.mockResolvedValue(mockAsins);

      const result = await tools['sb_get_store_asin_list'].handler({ brandEntityId: 'ENTITY123' });

      expect(getMock).toHaveBeenCalledWith(
        '/stores/v0/stores/ENTITY123/asins',
        undefined,
        { rateLimitCategory: 'sbStores' }
      );
      expect(result).toMatchObject({
        structuredContent: mockAsins,
      });
    });
  });

  describe('sb_upload_image', () => {
    it('should POST to correct endpoint with image params', async () => {
      const mockResult = { mediaId: 'media-1', status: 'PROCESSING' };
      postMock.mockResolvedValue(mockResult);

      const result = await tools['sb_upload_image'].handler({
        mediaType: 'image' as const,
        programType: 'SB' as const,
        creativeType: 'BRAND_LOGO' as const,
      });

      expect(postMock).toHaveBeenCalledWith(
        '/v2/hs/media/upload',
        { mediaType: 'image', programType: 'SB', creativeType: 'BRAND_LOGO' },
        { rateLimitCategory: 'sbCreative' }
      );
      expect(result).toMatchObject({
        structuredContent: mockResult,
      });
    });
  });

  describe('sb_upload_video', () => {
    it('should POST to correct endpoint with video params', async () => {
      const mockResult = { mediaId: 'media-2', status: 'PROCESSING' };
      postMock.mockResolvedValue(mockResult);

      const result = await tools['sb_upload_video'].handler({
        mediaType: 'video' as const,
        programType: 'SBV' as const,
      });

      expect(postMock).toHaveBeenCalledWith(
        '/v2/hs/media/upload',
        { mediaType: 'video', programType: 'SBV' },
        { rateLimitCategory: 'sbCreative' }
      );
      expect(result).toMatchObject({
        structuredContent: mockResult,
      });
    });
  });

  describe('sb_get_media_status', () => {
    it('should call correct endpoint with mediaId', async () => {
      const mockMedia = { mediaId: 'media-1', status: 'AVAILABLE', mediaType: 'image' };
      getMock.mockResolvedValue(mockMedia);

      const result = await tools['sb_get_media_status'].handler({ mediaId: 'media-1' });

      expect(getMock).toHaveBeenCalledWith(
        '/v2/hs/media/media-1',
        undefined,
        { rateLimitCategory: 'sbCreative' }
      );
      expect(result).toMatchObject({
        structuredContent: mockMedia,
      });
    });
  });

  describe('sb_list_media', () => {
    it('should call correct endpoint with no params', async () => {
      const mockMedia = { media: [{ mediaId: 'media-1' }, { mediaId: 'media-2' }], count: 2 };
      getMock.mockResolvedValue(mockMedia);

      const result = await tools['sb_list_media'].handler({});

      expect(getMock).toHaveBeenCalledWith(
        '/v2/hs/media',
        undefined,
        { rateLimitCategory: 'sbCreative' }
      );
      expect(result).toMatchObject({
        structuredContent: { media: mockMedia.media, count: 2 },
      });
    });
  });

  describe('sb_list_landing_pages', () => {
    it('should call correct endpoint with no params', async () => {
      const mockPages = { landingPages: [{ landingPageId: 'lp-1' }], count: 1 };
      getMock.mockResolvedValue(mockPages);

      const result = await tools['sb_list_landing_pages'].handler({});

      expect(getMock).toHaveBeenCalledWith(
        '/v2/hs/landingPages',
        undefined,
        { rateLimitCategory: 'sbLandingPages' }
      );
      expect(result).toMatchObject({
        structuredContent: { landingPages: mockPages.landingPages, count: 1 },
      });
    });
  });

  describe('sb_get_landing_page', () => {
    it('should call correct endpoint with landingPageId', async () => {
      const mockPage = { landingPageId: 'lp-1', pageName: 'Test Page' };
      getMock.mockResolvedValue(mockPage);

      const result = await tools['sb_get_landing_page'].handler({ landingPageId: 'lp-1' });

      expect(getMock).toHaveBeenCalledWith(
        '/v2/hs/landingPages/lp-1',
        undefined,
        { rateLimitCategory: 'sbLandingPages' }
      );
      expect(result).toMatchObject({
        structuredContent: mockPage,
      });
    });
  });
});
