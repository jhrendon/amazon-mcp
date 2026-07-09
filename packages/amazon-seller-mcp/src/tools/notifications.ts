import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSPAPIClient } from '../client/sp-api-client.js';
import { makeToolResponse } from './_shared/response.js';
import type {
  GetSubscriptionResponse,
  CreateSubscriptionResponse,
  DeleteSubscriptionResponse,
  GetDestinationsResponse,
  GetDestinationResponse,
  CreateDestinationResponse,
  DeleteDestinationResponse,
} from '../types/sp-api.js';

const notificationTypeSchema = z
  .string()
  .min(1)
  .describe('Notification type (e.g., ORDER_CHANGE, REPORT_PROCESSING_FINISHED)');

const subscriptionIdSchema = z
  .string()
  .min(1)
  .describe('Subscription ID');

const destinationIdSchema = z
  .string()
  .min(1)
  .describe('Destination ID');

const getSubscriptionSchema = z.object({
  notificationType: notificationTypeSchema,
});

const createSubscriptionSchema = z.object({
  notificationType: notificationTypeSchema,
  payloadVersion: z
    .string()
    .optional()
    .default('1.0')
    .describe('Payload version (default: "1.0")'),
  destinationId: destinationIdSchema,
  processingDirective: z
    .object({
      eventFilter: z.record(z.unknown()).optional(),
    })
    .optional()
    .describe('Processing directive for the subscription'),
});

const getSubscriptionByIdSchema = z.object({
  notificationType: notificationTypeSchema,
  subscriptionId: subscriptionIdSchema,
});

const deleteSubscriptionByIdSchema = z.object({
  notificationType: notificationTypeSchema,
  subscriptionId: subscriptionIdSchema,
});

const createDestinationSchema = z.object({
  name: z.string().min(1).describe('Destination name'),
  resourceSpecification: z
    .object({
      sqs: z
        .object({
          arn: z.string().min(1),
        })
        .optional(),
      eventBridge: z
        .object({
          region: z.string().min(1),
          accountId: z.string().min(1),
        })
        .optional(),
    })
    .describe('Resource specification: { sqs: { arn } } or { eventBridge: { region, accountId } }'),
});

const getDestinationSchema = z.object({
  destinationId: destinationIdSchema,
});

const deleteDestinationSchema = z.object({
  destinationId: destinationIdSchema,
});

export function registerNotificationsTools(server: McpServer): void {
  server.registerTool(
    'get_subscription',
    {
      description: 'Get a notification subscription by notification type.',
      inputSchema: getSubscriptionSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const response = await client.get<GetSubscriptionResponse>(
        `/notifications/v1/subscriptions/${encodeURIComponent(input.notificationType)}`,
        undefined,
        { rateLimitCategory: 'notifications' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'create_subscription',
    {
      description: 'Create a notification subscription for a given notification type.',
      inputSchema: createSubscriptionSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const body: Record<string, unknown> = {
        payloadVersion: input.payloadVersion,
        destinationId: input.destinationId,
      };

      if (input.processingDirective) {
        body.processingDirective = input.processingDirective;
      }

      const response = await client.post<CreateSubscriptionResponse>(
        `/notifications/v1/subscriptions/${encodeURIComponent(input.notificationType)}`,
        body,
        { rateLimitCategory: 'notifications' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_subscription_by_id',
    {
      description: 'Get a specific notification subscription by notification type and subscription ID.',
      inputSchema: getSubscriptionByIdSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const response = await client.get<GetSubscriptionResponse>(
        `/notifications/v1/subscriptions/${encodeURIComponent(input.notificationType)}/${encodeURIComponent(input.subscriptionId)}`,
        undefined,
        { rateLimitCategory: 'notifications' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'delete_subscription_by_id',
    {
      description: 'Delete a notification subscription by notification type and subscription ID.',
      inputSchema: deleteSubscriptionByIdSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const response = await client.delete<DeleteSubscriptionResponse>(
        `/notifications/v1/subscriptions/${encodeURIComponent(input.notificationType)}/${encodeURIComponent(input.subscriptionId)}`,
        undefined,
        { rateLimitCategory: 'notifications' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_destinations',
    {
      description: 'Get all notification destinations.',
      inputSchema: z.object({}),
    },
    async () => {
      const client = getSPAPIClient();

      const response = await client.get<GetDestinationsResponse>(
        '/notifications/v1/destinations',
        undefined,
        { rateLimitCategory: 'notifications' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'create_destination',
    {
      description: 'Create a notification destination for SQS or EventBridge.',
      inputSchema: createDestinationSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const body = {
        name: input.name,
        resourceSpecification: input.resourceSpecification,
      };

      const response = await client.post<CreateDestinationResponse>(
        '/notifications/v1/destinations',
        body,
        { rateLimitCategory: 'notifications' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'get_destination',
    {
      description: 'Get a specific notification destination by destination ID.',
      inputSchema: getDestinationSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const response = await client.get<GetDestinationResponse>(
        `/notifications/v1/destinations/${encodeURIComponent(input.destinationId)}`,
        undefined,
        { rateLimitCategory: 'notifications' }
      );

      return makeToolResponse(response);
    }
  );

  server.registerTool(
    'delete_destination',
    {
      description: 'Delete a notification destination by destination ID.',
      inputSchema: deleteDestinationSchema,
    },
    async (input) => {
      const client = getSPAPIClient();

      const response = await client.delete<DeleteDestinationResponse>(
        `/notifications/v1/destinations/${encodeURIComponent(input.destinationId)}`,
        undefined,
        { rateLimitCategory: 'notifications' }
      );

      return makeToolResponse(response);
    }
  );
}
