# Phase 13: Notifications API

**Status:** Planned
**Date:** 2026-07-09

Tools for subscribing to real-time SP-API notifications (ORDER_CHANGE, etc.) via SQS or EventBridge.

---

## 1. Subscriptions (4 tools)

### get_subscription

- **Description:** Get the subscription for a notification type. Returns the subscription if one exists.
- **Endpoint:** `GET /notifications/v1/subscriptions/{notificationType}`
- **Rate Limit Category:** `notifications`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `notificationType` | `string` | **Yes** | — | Notification type (e.g. `ORDER_CHANGE`) |

- **Response:**
```json
{
  "payload": {
    "subscriptionId": "sub-1234567890",
    "payloadVersion": "1.0",
    "destinationId": "dest-1234567890",
    "processingDirective": {}
  }
}
```

---

### create_subscription

- **Description:** Create a subscription for a notification type.
- **Endpoint:** `POST /notifications/v1/subscriptions/{notificationType}`
- **Rate Limit Category:** `notifications`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `notificationType` | `string` | **Yes** | — | e.g. `ORDER_CHANGE`, `REPORT_PROCESSING_FINISHED` |
| `payloadVersion` | `string` | No | `1.0` | Payload version |
| `destinationId` | `string` | **Yes** | — | Destination ID |
| `processingDirective` | `object` | No | — | Event filter config |

- **Response:**
```json
{
  "subscriptionId": "sub-1234567890",
  "payloadVersion": "1.0",
  "destinationId": "dest-1234567890"
}
```

---

### get_subscription_by_id

- **Description:** Get a subscription by its subscription ID.
- **Endpoint:** `GET /notifications/v1/subscriptions/{notificationType}/{subscriptionId}`
- **Rate Limit Category:** `notifications`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `notificationType` | `string` | **Yes** | — | Notification type |
| `subscriptionId` | `string` | **Yes** | — | Subscription ID |

- **Response:** Subscription object

---

### delete_subscription_by_id

- **Description:** Delete a subscription.
- **Endpoint:** `DELETE /notifications/v1/subscriptions/{notificationType}/{subscriptionId}`
- **Rate Limit Category:** `notifications`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `notificationType` | `string` | **Yes** | — | Notification type |
| `subscriptionId` | `string` | **Yes** | — | Subscription ID |

- **Response:** Empty on success

---

## 2. Destinations (4 tools)

### get_destinations

- **Description:** List all notification destinations.
- **Endpoint:** `GET /notifications/v1/destinations`
- **Rate Limit Category:** `notifications`
- **Parameters:** None
- **Response:**
```json
{
  "destinations": [{
    "destinationId": "dest-1234567890",
    "name": "My SQS Queue",
    "resource": {
      "sqs": {
        "arn": "arn:aws:sqs:us-east-1:123456789012:my-queue"
      }
    }
  }]
}
```

---

### create_destination

- **Description:** Create a notification destination (SQS queue or EventBridge).
- **Endpoint:** `POST /notifications/v1/destinations`
- **Rate Limit Category:** `notifications`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | `string` | **Yes** | — | Destination name |
| `resourceSpecification` | `object` | **Yes** | — | `{ sqs: { arn } }` or `{ eventBridge: { region, accountId } }` |

- **Response:**
```json
{
  "destinationId": "dest-1234567890",
  "name": "My SQS Queue",
  "resource": {
    "sqs": {
      "arn": "arn:aws:sqs:us-east-1:123456789012:my-queue"
    }
  }
}
```

---

### get_destination

- **Description:** Get a specific destination by ID.
- **Endpoint:** `GET /notifications/v1/destinations/{destinationId}`
- **Rate Limit Category:** `notifications`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `destinationId` | `string` | **Yes** | — | Destination ID |

- **Response:** Destination object

---

### delete_destination

- **Description:** Delete a notification destination.
- **Endpoint:** `DELETE /notifications/v1/destinations/{destinationId}`
- **Rate Limit Category:** `notifications`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `destinationId` | `string` | **Yes** | — | Destination ID |

- **Response:** Empty on success

---

## Architecture

### Notification Types

- `ORDER_CHANGE` — Order status changes
- `REPORT_PROCESSING_FINISHED` — Report processing complete
- `BRANDED_ITEM_CONTENT_CHANGE` — Brand content changes
- `ITEM_PRODUCT_TYPE_CHANGE` — Product type changes
- `LISTINGS_ITEM_STATUS_CHANGE` — Listing status changes
- `LISTINGS_ITEM_ISSUES_CHANGE` — Listing issues changes
- `ORDER_STATUS_CHANGE` — Order status transitions
- `B2B_ANY_OFFER_CHANGED` — B2B offer changes

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `notifications` | 1 | 5 |

### EventBridge vs SQS

- **SQS:** Simpler setup, pull-based. Create SQS queue → grant SP-API permission → subscribe.
- **EventBridge:** Push-based, supports event filtering and routing to multiple targets.

---

## Next Steps

- Future phases TBD
