# Phase 11: Fulfillment Outbound (MCF)

**Status:** Planned
**Date:** 2026-07-09

Multi-Channel Fulfillment (MCF) tools for creating and managing fulfillment orders using FBA inventory to ship to non-Amazon channels.

---

## 1. Fulfillment Orders (7 tools)

### get_fulfillment_preview

- **Description:** Get fulfillment previews (shipping speed options, fees, delivery dates) for a set of items and destination.
- **Endpoint:** `POST /fba/outbound/2020-07-01/fulfillmentOrders/preview`
- **Rate Limit Category:** `fulfillmentOutbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |
| `address` | `object` | **Yes** | — | Destination address |
| `items` | `array` | **Yes** | — | Items with sellerSku and quantity |
| `shippingSpeedCategories` | `enum[]` | No | — | Filter: `Standard`, `Expedited`, `Priority`, `ScheduledDelivery` |

- **Response:**
```json
{
  "preview": {
    "address": { "name": "John Doe", "line1": "123 Main St", "city": "Seattle", "stateOrRegion": "WA", "postalCode": "98101", "countryCode": "US" },
    "items": [{ "sellerSku": "MY-SKU-001", "quantity": 2 }],
    "shippingSpeedCategories": ["Standard"],
    "scheduledFulfillmentOrders": [{
      "shippingSpeedCategory": "Standard",
      "fulfillmentPreviewShipments": [{
        "earliestShipDate": "2025-01-16T00:00:00Z",
        "latestShipDate": "2025-01-17T00:00:00Z",
        "earliestArrivalDate": "2025-01-20T00:00:00Z",
        "latestArrivalDate": "2025-01-22T00:00:00Z",
        "fulfillmentPreviewItems": [{
          "sellerSku": "MY-SKU-001",
          "quantity": 2,
          "sellerFulfillmentOrderItemId": "1",
          "shippingWeightCalculationMethod": "Package",
          "shippingMethod": "Standard"
        }]
      }]
    }]
  }
}
```

---

### list_fulfillment_orders

- **Description:** List all fulfillment orders with optional date filter.
- **Endpoint:** `GET /fba/outbound/2020-07-01/fulfillmentOrders`
- **Rate Limit Category:** `fulfillmentOutbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `queryStartDate` | `string` | No | — | ISO 8601 date. Only return orders created after this date |
| `nextToken` | `string` | No | — | Pagination token |

- **Response:**
```json
{
  "fulfillmentOrders": [{
    "sellerFulfillmentOrderId": "MCF-001",
    "displayableOrderId": "MCF-001",
    "statusCreatedDate": "2025-01-15T10:30:00Z",
    "fulfillmentOrderStatus": "COMPLETE",
    "shippingSpeedCategory": "Standard",
    "destinationAddress": { "name": "John Doe", "city": "Seattle", "stateOrRegion": "WA", "countryCode": "US" }
  }],
  "nextToken": null
}
```

---

### create_fulfillment_order

- **Description:** Create a new MCF fulfillment order.
- **Endpoint:** `POST /fba/outbound/2020-07-01/fulfillmentOrders`
- **Rate Limit Category:** `fulfillmentOutbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `sellerFulfillmentOrderId` | `string` | **Yes** | — | Unique order ID |
| `displayableOrderId` | `string` | **Yes** | — | Display order ID |
| `displayableOrderDate` | `string` | **Yes** | — | ISO 8601 date |
| `displayableOrderComment` | `string` | No | — | Order comment |
| `shippingSpeedCategory` | `enum` | **Yes** | — | `Standard`, `Expedited`, `Priority` |
| `destinationAddress` | `object` | **Yes** | — | Shipping address |
| `items` | `array` | **Yes** | — | Items with sellerSku, quantity, perUnitDeclaredValue |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:** Empty on success (200/201)

---

### get_fulfillment_order

- **Description:** Get details of a specific fulfillment order including shipments and items.
- **Endpoint:** `GET /fba/outbound/2020-07-01/fulfillmentOrders/{sellerFulfillmentOrderId}`
- **Rate Limit Category:** `fulfillmentOutbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `sellerFulfillmentOrderId` | `string` | **Yes** | — | Seller fulfillment order ID |

- **Response:**
```json
{
  "fulfillmentOrder": {
    "sellerFulfillmentOrderId": "MCF-001",
    "displayableOrderId": "MCF-001",
    "fulfillmentOrderStatus": "COMPLETE",
    "shippingSpeedCategory": "Standard"
  },
  "fulfillmentOrderItems": [{
    "sellerSku": "MY-SKU-001",
    "sellerFulfillmentOrderItemId": "1",
    "quantity": 2,
    "fulfillmentNetworkSku": "X001ABCDEF"
  }],
  "fulfillmentShipments": [{
    "amazonShipmentId": "F1234567",
    "fulfillmentCenterId": "SEA8",
    "fulfillmentShipmentStatus": "SHIPPED",
    "shippingDateTime": "2025-01-16T00:00:00Z",
    "estimatedArrivalDateTime": "2025-01-20T00:00:00Z",
    "fulfillmentShipmentItems": [{
      "sellerSku": "MY-SKU-001",
      "quantity": 2,
      "packageNumber": 1
    }]
  }]
}
```

---

### update_fulfillment_order

- **Description:** Update an existing fulfillment order (address, items, shipping speed).
- **Endpoint:** `PUT /fba/outbound/2020-07-01/fulfillmentOrders/{sellerFulfillmentOrderId}`
- **Rate Limit Category:** `fulfillmentOutbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `sellerFulfillmentOrderId` | `string` | **Yes** | — | Seller fulfillment order ID |
| `destinationAddress` | `object` | No | — | Updated shipping address |
| `shippingSpeedCategory` | `enum` | No | — | Updated shipping speed |
| `items` | `array` | No | — | Updated items |

- **Response:** Empty on success

---

### cancel_fulfillment_order

- **Description:** Cancel a fulfillment order that has not yet shipped.
- **Endpoint:** `PUT /fba/outbound/2020-07-01/fulfillmentOrders/{sellerFulfillmentOrderId}/cancel`
- **Rate Limit Category:** `fulfillmentOutbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `sellerFulfillmentOrderId` | `string` | **Yes** | — | Seller fulfillment order ID |

- **Response:** Empty on success

---

### get_package_tracking_details

- **Description:** Get tracking details for a specific package in a fulfillment order.
- **Endpoint:** `GET /fba/outbound/2020-07-01/tracking?packageTrackingId={packageTrackingId}`
- **Rate Limit Category:** `fulfillmentOutbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `packageTrackingId` | `string` | **Yes** | — | Package tracking ID |

- **Response:** Tracking details with carrier, tracking number, and events

---

## 2. Returns (2 tools)

### list_return_reason_codes

- **Description:** List available return reason codes for MCF returns.
- **Endpoint:** `GET /fba/outbound/2020-07-01/returnReasonCodes`
- **Rate Limit Category:** `fulfillmentOutbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `sellerSku` | `string` | **Yes** | — | Seller SKU |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |
| `sellerFulfillmentOrderId` | `string` | No | — | Seller fulfillment order ID |

- **Response:** Return reason codes list

---

### create_fulfillment_return

- **Description:** Create a return for an MCF fulfillment order.
- **Endpoint:** `PUT /fba/outbound/2020-07-01/fulfillmentOrders/{sellerFulfillmentOrderId}/return`
- **Rate Limit Category:** `fulfillmentOutbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `sellerFulfillmentOrderId` | `string` | **Yes** | — | Seller fulfillment order ID |
| `items` | `array` | **Yes** | — | Items with returnReasonCode |
| `returnId` | `string` | No | — | Return ID |

- **Response:** Return details

---

## 3. Features (3 tools)

### get_features

- **Description:** List available MCF features (Blank Box, Block AMZL, etc.).
- **Endpoint:** `GET /fba/outbound/2020-07-01/features`
- **Rate Limit Category:** `fulfillmentOutbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:** Features list

---

### get_feature_inventory

- **Description:** Get inventory eligible for a specific MCF feature.
- **Endpoint:** `GET /fba/outbound/2020-07-01/features/inventory/{featureName}`
- **Rate Limit Category:** `fulfillmentOutbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `featureName` | `string` | **Yes** | — | Feature name (e.g. `BLANK_BOX`) |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |
| `nextToken` | `string` | No | — | Pagination token |

- **Response:** Feature-eligible inventory list

---

### get_feature_sku

- **Description:** Get feature eligibility for a specific SKU.
- **Endpoint:** `GET /fba/outbound/2020-07-01/features/inventory/{featureName}/{sellerSku}`
- **Rate Limit Category:** `fulfillmentOutbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `featureName` | `string` | **Yes** | — | Feature name |
| `sellerSku` | `string` | **Yes** | — | Seller SKU |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:** Feature eligibility for SKU

---

## Architecture

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `fulfillmentOutbound` | 2 | 30 |

---

## Next Steps

- Phase 12: Negative Keywords & Targets (Ads)
