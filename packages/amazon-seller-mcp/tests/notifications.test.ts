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

import { registerNotificationsTools } from '../src/tools/notifications.js';
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

describe('notifications tools', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    deleteMock.mockReset();
    setParticipatingMarketplaceIds(['ATVPDKIKX0DER']);
  });

  describe('get_subscription', () => {
    it('calls the correct endpoint and returns the subscription', async () => {
      const apiResponse = {
        payload: { subscriptionId: 'sub-1', payloadVersion: '1.0', destinationId: 'dest-1' },
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerNotificationsTools(server);
      const handler = tools['get_subscription'].handler;

      const result = (await handler({ notificationType: 'ORDER_CHANGE' })) as {
        structuredContent: typeof apiResponse;
      };

      expect(getMock).toHaveBeenCalledWith(
        '/notifications/v1/subscriptions/ORDER_CHANGE',
        undefined,
        expect.objectContaining({ rateLimitCategory: 'notifications' })
      );
      expect(result.structuredContent.payload.subscriptionId).toBe('sub-1');
      expect(result.structuredContent.payload.destinationId).toBe('dest-1');
    });
  });

  describe('create_subscription', () => {
    it('creates a subscription with the correct body', async () => {
      const apiResponse = {
        payload: { subscriptionId: 'sub-new', payloadVersion: '1.0', destinationId: 'dest-1' },
      };
      postMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerNotificationsTools(server);
      const handler = tools['create_subscription'].handler;

      const result = (await handler({
        notificationType: 'REPORT_PROCESSING_FINISHED',
        destinationId: 'dest-1',
      })) as { structuredContent: typeof apiResponse };

      expect(postMock).toHaveBeenCalledWith(
        '/notifications/v1/subscriptions/REPORT_PROCESSING_FINISHED',
        expect.objectContaining({ destinationId: 'dest-1' }),
        expect.objectContaining({ rateLimitCategory: 'notifications' })
      );
      expect(result.structuredContent.payload.subscriptionId).toBe('sub-new');
    });

    it('includes processingDirective when provided', async () => {
      postMock.mockResolvedValue({ payload: { subscriptionId: 'sub-2', payloadVersion: '1.0', destinationId: 'dest-1' } });

      const { server, tools } = makeServer();
      registerNotificationsTools(server);
      const handler = tools['create_subscription'].handler;

      await handler({
        notificationType: 'ORDER_CHANGE',
        destinationId: 'dest-1',
        processingDirective: { eventFilter: { marketplaceIds: ['ATVPDKIKX0DER'] } },
      });

      expect(postMock).toHaveBeenCalledWith(
        '/notifications/v1/subscriptions/ORDER_CHANGE',
        expect.objectContaining({
          processingDirective: { eventFilter: { marketplaceIds: ['ATVPDKIKX0DER'] } },
        }),
        expect.any(Object)
      );
    });

    it('rejects missing destinationId via zod', () => {
      const { server, tools } = makeServer();
      registerNotificationsTools(server);
      const schema = tools['create_subscription'].schema as { parse: (v: unknown) => unknown };
      expect(() => schema.parse({ notificationType: 'ORDER_CHANGE' })).toThrow();
    });

    it('rejects missing notificationType via zod', () => {
      const { server, tools } = makeServer();
      registerNotificationsTools(server);
      const schema = tools['create_subscription'].schema as { parse: (v: unknown) => unknown };
      expect(() => schema.parse({ destinationId: 'dest-1' })).toThrow();
    });
  });

  describe('get_subscription_by_id', () => {
    it('calls the correct endpoint and returns the subscription', async () => {
      const apiResponse = {
        payload: { subscriptionId: 'sub-1', payloadVersion: '1.0', destinationId: 'dest-1' },
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerNotificationsTools(server);
      const handler = tools['get_subscription_by_id'].handler;

      const result = (await handler({ notificationType: 'ORDER_CHANGE', subscriptionId: 'sub-1' })) as {
        structuredContent: typeof apiResponse;
      };

      expect(getMock).toHaveBeenCalledWith(
        '/notifications/v1/subscriptions/ORDER_CHANGE/sub-1',
        undefined,
        expect.objectContaining({ rateLimitCategory: 'notifications' })
      );
      expect(result.structuredContent.payload.subscriptionId).toBe('sub-1');
    });
  });

  describe('delete_subscription_by_id', () => {
    it('calls DELETE on the correct endpoint', async () => {
      deleteMock.mockResolvedValue({});

      const { server, tools } = makeServer();
      registerNotificationsTools(server);
      const handler = tools['delete_subscription_by_id'].handler;

      await handler({ notificationType: 'ORDER_CHANGE', subscriptionId: 'sub-1' });

      expect(deleteMock).toHaveBeenCalledWith(
        '/notifications/v1/subscriptions/ORDER_CHANGE/sub-1',
        undefined,
        expect.objectContaining({ rateLimitCategory: 'notifications' })
      );
    });
  });

  describe('get_destinations', () => {
    it('returns all destinations', async () => {
      const apiResponse = {
        destinations: [
          { destinationId: 'dest-1', name: 'My SQS', resource: { sqs: { arn: 'arn:aws:sqs:...' } } },
          { destinationId: 'dest-2', name: 'My EB', resource: { eventBridge: { region: 'us-east-1' } } },
        ],
      };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerNotificationsTools(server);
      const handler = tools['get_destinations'].handler;

      const result = (await handler({})) as { structuredContent: typeof apiResponse };

      expect(getMock).toHaveBeenCalledWith(
        '/notifications/v1/destinations',
        undefined,
        expect.objectContaining({ rateLimitCategory: 'notifications' })
      );
      expect(result.structuredContent.destinations).toHaveLength(2);
    });
  });

  describe('create_destination', () => {
    it('creates an SQS destination', async () => {
      const apiResponse = { destinationId: 'dest-new', name: 'My SQS', resource: { sqs: { arn: 'arn:aws:sqs:...' } } };
      postMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerNotificationsTools(server);
      const handler = tools['create_destination'].handler;

      const result = (await handler({
        name: 'My SQS',
        resourceSpecification: { sqs: { arn: 'arn:aws:sqs:us-east-1:123456789:my-queue' } },
      })) as { structuredContent: typeof apiResponse };

      expect(postMock).toHaveBeenCalledWith(
        '/notifications/v1/destinations',
        expect.objectContaining({
          name: 'My SQS',
          resourceSpecification: { sqs: { arn: 'arn:aws:sqs:us-east-1:123456789:my-queue' } },
        }),
        expect.objectContaining({ rateLimitCategory: 'notifications' })
      );
      expect(result.structuredContent.destinationId).toBe('dest-new');
    });

    it('rejects missing name via zod', () => {
      const { server, tools } = makeServer();
      registerNotificationsTools(server);
      const schema = tools['create_destination'].schema as { parse: (v: unknown) => unknown };
      expect(() =>
        schema.parse({ resourceSpecification: { sqs: { arn: 'arn:aws:sqs:...' } } })
      ).toThrow();
    });

    it('rejects missing resourceSpecification via zod', () => {
      const { server, tools } = makeServer();
      registerNotificationsTools(server);
      const schema = tools['create_destination'].schema as { parse: (v: unknown) => unknown };
      expect(() => schema.parse({ name: 'My Destination' })).toThrow();
    });
  });

  describe('get_destination', () => {
    it('returns a specific destination', async () => {
      const apiResponse = { destinationId: 'dest-1', name: 'My SQS', resource: { sqs: { arn: 'arn:aws:sqs:...' } } };
      getMock.mockResolvedValue(apiResponse);

      const { server, tools } = makeServer();
      registerNotificationsTools(server);
      const handler = tools['get_destination'].handler;

      const result = (await handler({ destinationId: 'dest-1' })) as {
        structuredContent: typeof apiResponse;
      };

      expect(getMock).toHaveBeenCalledWith(
        '/notifications/v1/destinations/dest-1',
        undefined,
        expect.objectContaining({ rateLimitCategory: 'notifications' })
      );
      expect(result.structuredContent.destinationId).toBe('dest-1');
    });
  });

  describe('delete_destination', () => {
    it('calls DELETE on the correct endpoint', async () => {
      deleteMock.mockResolvedValue({});

      const { server, tools } = makeServer();
      registerNotificationsTools(server);
      const handler = tools['delete_destination'].handler;

      await handler({ destinationId: 'dest-1' });

      expect(deleteMock).toHaveBeenCalledWith(
        '/notifications/v1/destinations/dest-1',
        undefined,
        expect.objectContaining({ rateLimitCategory: 'notifications' })
      );
    });
  });
});
