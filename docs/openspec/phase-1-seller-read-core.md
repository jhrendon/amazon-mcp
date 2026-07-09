# Phase 1: Seller Read Core

**Status:** Implemented  
**Date:** 2026-07-08

Read tools from Seller Central (SP-API) for the fundamental categories: Orders, Inventory, Sales, and Catalog.

---

## 1. Orders (3 tools)

### get_orders

- **Description:** Retrieve a list of orders from Amazon Seller Central. Filter by date range, status, and fulfillment channel.
- **Endpoint:** `GET /orders/v0/orders`
- **Rate Limit Category:** `orders`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `createdAfter` | `string` | No | — | ISO 8601. Orders created after this date |
| `createdBefore` | `string` | No | — | ISO 8601. Orders created before this date |
| `lastUpdatedAfter` | `string` | No | — | ISO 8601. Orders updated after this date |
| `lastUpdatedBefore` | `string` | No | — | ISO 8601. Orders updated before this date |
| `orderStatuses` | `string[]` | No | — | Pending, Unshipped, PartiallyShipped, Shipped, Canceled |
| `fulfillmentChannels` | `enum[]` (`AFN`, `MFN`) | No | — | AFN (FBA) or MFN (Merchant Fulfilled) |
| `maxResults` | `number` | No | `100` | Max orders to return (max 100) |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:**
```json
{
  "totalOrders": 25,
  "pagesFetched": 1,
  "hasMore": false,
  "orders": [{
    "orderId": "111-1234567-1234567",
    "status": "Shipped",
    "purchaseDate": "2025-01-15T10:30:00Z",
    "lastUpdateDate": "2025-01-16T08:00:00Z",
    "fulfillmentChannel": "AFN",
    "salesChannel": "Amazon.com",
    "orderTotal": { "Amount": "29.99", "CurrencyCode": "USD" },
    "numberOfItemsShipped": 1,
    "numberOfItemsUnshipped": 0,
    "isPrime": true,
    "isBusinessOrder": false
  }]
}
```

- **Pagination:** Fetches up to `maxResults` orders across up to 20 pages using `NextToken`.

---

### get_order_details

- **Description:** Get detailed information about a specific Amazon order. Returns shipping address, buyer info, and order status.
- **Endpoint:** `GET /orders/v0/orders/{orderId}`
- **Rate Limit Category:** `orders`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `orderId` | `string` (pattern: `^\d{3}-\d{7}-\d{7}$`) | **Yes** | — | Amazon order ID |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |
| `restrictedDataToken` | `string` | No | — | RDT to access PII (shippingAddress, buyerInfo) |

- **Response:**
```json
{
  "orderId": "111-1234567-1234567",
  "sellerOrderId": "111-1234567-1234567",
  "status": "Shipped",
  "purchaseDate": "2025-01-15T10:30:00Z",
  "lastUpdateDate": "2025-01-16T08:00:00Z",
  "fulfillmentChannel": "AFN",
  "salesChannel": "Amazon.com",
  "orderTotal": { "Amount": "29.99", "CurrencyCode": "USD" },
  "paymentMethod": "COD",
  "numberOfItemsShipped": 1,
  "numberOfItemsUnshipped": 0,
  "isPrime": true,
  "isBusinessOrder": false,
  "shippingAddress": null,
  "buyerInfo": null,
  "earliestShipDate": "2025-01-15T00:00:00Z",
  "latestShipDate": "2025-01-17T00:00:00Z",
  "earliestDeliveryDate": "2025-01-18T00:00:00Z",
  "latestDeliveryDate": "2025-01-22T00:00:00Z"
}
```

- **Note:** `shippingAddress` and `buyerInfo` are only populated when a `restrictedDataToken` is provided.

---

### get_order_items

- **Description:** Get the line items (products) for a specific Amazon order. Returns ASIN, SKU, quantity, price, and tax per item.
- **Endpoint:** `GET /orders/v0/orders/{orderId}/orderItems`
- **Rate Limit Category:** `orderItems`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `orderId` | `string` (pattern: `^\d{3}-\d{7}-\d{7}$`) | **Yes** | — | Amazon order ID |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:**
```json
{
  "orderId": "111-1234567-1234567",
  "totalItems": 2,
  "items": [{
    "orderItemId": "12345678901234",
    "asin": "B08N5WRWNW",
    "sellerSku": "MY-SKU-001",
    "title": "Product Name",
    "quantityOrdered": 1,
    "quantityShipped": 1,
    "itemPrice": { "Amount": "24.99", "CurrencyCode": "USD" },
    "itemTax": { "Amount": "2.00", "CurrencyCode": "USD" },
    "shippingPrice": { "Amount": "3.00", "CurrencyCode": "USD" },
    "shippingTax": { "Amount": "0.00", "CurrencyCode": "USD" },
    "promotionDiscount": { "Amount": "0.00", "CurrencyCode": "USD" },
    "isGift": false,
    "conditionId": "New"
  }]
}
```

- **Pagination:** Fetches across up to 20 pages using `NextToken`.

---

## 2. FBA Inventory (2 tools)

### get_inventory_summary

- **Description:** Get FBA inventory summary including quantity available, reserved, inbound, and unfulfillable. Shows inventory health at a glance.
- **Endpoint:** `GET /fba/inventory/v1/summaries`
- **Rate Limit Category:** `inventory`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `sellerSkus` | `string[]` | No | — | Filter by specific seller SKUs (max 50) |
| `nextToken` | `string` | No | — | Pagination token for next page |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Query Params sent:** `granularityType=Marketplace`, `granularityId={marketplaceId}`, `marketplaceIds={marketplaceId}`, `details=true`
- **Response:**
```json
{
  "totalSkus": 15,
  "hasMore": false,
  "nextToken": null,
  "inventory": [{
    "asin": "B08N5WRWNW",
    "fnSku": "X001ABCDEF",
    "sellerSku": "MY-SKU-001",
    "productName": "Product Name",
    "condition": "NewItem",
    "totalQuantity": 100,
    "fulfillableQuantity": 85,
    "inboundWorking": 10,
    "inboundShipped": 5,
    "inboundReceiving": 0,
    "reserved": 10,
    "unfulfillable": 5,
    "lastUpdated": "2025-01-15T00:00:00Z"
  }]
}
```

---

### get_fba_inventory_details

- **Description:** Get detailed FBA inventory information including breakdown of reserved quantities, unfulfillable reasons, and researching quantities.
- **Endpoint:** `GET /fba/inventory/v1/summaries` (same endpoint, extended response)
- **Rate Limit Category:** `inventory`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `sellerSku` | `string` | No | — | Filter by specific seller SKU |
| `asin` | `string` | No | — | Filter by specific ASIN (client-side filter) |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:**
```json
{
  "totalItems": 1,
  "inventoryDetails": [{
    "asin": "B08N5WRWNW",
    "fnSku": "X001ABCDEF",
    "sellerSku": "MY-SKU-001",
    "productName": "Product Name",
    "condition": "NewItem",
    "totalQuantity": 100,
    "lastUpdated": "2025-01-15T00:00:00Z",
    "details": {
      "fulfillable": 85,
      "inbound": { "working": 10, "shipped": 5, "receiving": 0 },
      "reserved": {
        "total": 10,
        "pendingCustomerOrder": 5,
        "pendingTransshipment": 3,
        "fcProcessing": 2
      },
      "unfulfillable": {
        "total": 5,
        "customerDamaged": 2,
        "warehouseDamaged": 1,
        "distributorDamaged": 0,
        "carrierDamaged": 1,
        "defective": 1,
        "expired": 0
      },
      "researching": {
        "total": 0,
        "breakdown": []
      }
    }
  }]
}
```

- **Note:** ASIN filtering is performed client-side after the API call.

---

## 3. Sales (2 tools)

### get_sales_metrics

- **Description:** Get aggregated sales metrics from Amazon Sales API. USE THIS for longer date ranges (7+ days). **Data has a 24-48 hour delay** — the last 2 days will NOT have data. For yesterday/today sales, use `get_sales_summary`.
- **Endpoint:** `GET /sales/v1/orderMetrics`
- **Rate Limit Category:** `sales`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `startDate` | `string` | **Yes** | — | Start date in ISO 8601 format (e.g., 2025-01-01) |
| `endDate` | `string` | **Yes** | — | End date in ISO 8601 format (e.g., 2025-01-31) |
| `interval` | `enum` (`Day`, `Week`, `Month`, `Total`) | No | `Day` | Time granularity |
| `asin` | `string` | No | — | Filter by specific ASIN |
| `sku` | `string` | No | — | Filter by specific SKU |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:**
```json
{
  "summary": {
    "dateRange": { "start": "2025-01-01", "end": "2025-01-31" },
    "granularity": "Day",
    "totalUnits": 500,
    "totalOrders": 400,
    "totalSales": { "amount": "12500.00", "currencyCode": "USD" },
    "averageOrderValue": "31.25",
    "averageUnitsPerOrder": "1.25"
  },
  "dataPoints": 31,
  "metrics": [{
    "interval": "2025-01-01",
    "unitCount": 15,
    "orderCount": 12,
    "orderItemCount": 15,
    "averageUnitPrice": { "currencyCode": "USD", "amount": 25.00 },
    "totalSales": { "currencyCode": "USD", "amount": 375.00 }
  }]
}
```

- **Note:** Client-side total aggregation with `Number()` coercion to avoid string concatenation bugs.

---

### get_sales_summary

- **Description:** Get REAL-TIME sales summary calculated from orders data. USE THIS for yesterday/today sales (last 48 hours) since Sales API has a delay.
- **Endpoint:** `GET /orders/v0/orders` (reuses Orders API)
- **Rate Limit Category:** `orders`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `startDate` | `string` | **Yes** | — | Start date in YYYY-MM-DD format |
| `endDate` | `string` | **Yes** | — | End date in YYYY-MM-DD format |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:**
```json
{
  "summary": {
    "dateRange": { "start": "2025-01-14", "end": "2025-01-15" },
    "totalOrders": 25,
    "totalOrdersIncludingCanceled": 27,
    "totalUnits": 30,
    "totalSales": { "amount": "750.00", "currencyCode": "USD" },
    "averageOrderValue": "30.00",
    "pagesFetched": 1
  },
  "dailyBreakdown": [{
    "date": "2025-01-14",
    "sales": "400.00",
    "orders": 13,
    "units": 15
  }, {
    "date": "2025-01-15",
    "sales": "350.00",
    "orders": 12,
    "units": 15
  }]
}
```

- **Implementation:**
  - Fetches ALL orders via pagination (up to 50 pages x 100 = 5000 orders)
  - Filters to `Shipped` / `PartiallyShipped` orders only
  - Clamps `CreatedBefore` to `now - 2 minutes` (Orders API requirement)
  - Currency auto-detected from first shipped order or falls back to marketplace currency map

---

## 4. Catalog (2 tools)

### get_catalog_item

- **Description:** Get detailed product information from the Amazon catalog by ASIN. Returns title, brand, category, BSR, images, bullet points, and attributes.
- **Endpoint:** `GET /catalog/2022-04-01/items/{asin}`
- **Rate Limit Category:** `catalog`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `asin` | `string` | **Yes** | — | ASIN of the product |
| `includedData` | `string` | No | `summaries,attributes,salesRanks,images` | Comma-separated: summaries, attributes, salesRanks, images, dimensions, identifiers, relationships, productTypes |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:**
```json
{
  "asin": "B08N5WRWNW",
  "title": "Product Name",
  "brand": "Brand Name",
  "manufacturer": "Manufacturer",
  "classification": { "type": "Product", "displayName": "Category Name" },
  "color": "Black",
  "size": "Large",
  "modelNumber": "MODEL-001",
  "packageQuantity": 1,
  "bulletPoints": ["Feature 1", "Feature 2", "Feature 3"],
  "salesRanks": [{ "title": "Category", "rank": 1500, "link": "..." }],
  "imageCount": 7,
  "images": [{ "variant": "MAIN", "link": "https://...", "width": 2000, "height": 2000 }],
  "attributes": {}
}
```

- **Note:** Images limited to first 10. Summary matched by `marketplaceId` or falls back to first available.

---

### search_catalog

- **Description:** Search the Amazon catalog by keywords or identifiers (ASIN, SKU, UPC, EAN). Returns matching items with summaries.
- **Endpoint:** `GET /catalog/2022-04-01/items`
- **Rate Limit Category:** `catalog`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `keywords` | `string` | No* | — | Keywords to search |
| `identifiers` | `string` | No* | — | Comma-separated identifiers (ASINs, SKUs, UPCs, EANs) |
| `identifiersType` | `enum` (`ASIN`, `SKU`, `UPC`, `EAN`) | No | — | Type of identifiers provided |
| `includedData` | `string` | No | `summaries` | Comma-separated data sections |
| `pageSize` | `number` | No | `10` | Results per page (max 20) |
| `pageToken` | `string` | No | — | Pagination token for next page |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

*\*At least one of `keywords` or `identifiers` must be provided (validated client-side).*

- **Response:**
```json
{
  "totalResults": 5,
  "hasMore": false,
  "nextToken": null,
  "items": [{
    "asin": "B08N5WRWNW",
    "title": "Product Name",
    "brand": "Brand Name",
    "classification": { "type": "Product", "displayName": "Category" },
    "color": "Black",
    "size": "Large"
  }]
}
```

---

## Architecture

### Common Patterns

- All tools use `zod` for input schema validation
- All resolve `marketplaceId` via `resolveMarketplaceId()` with env var fallback, then validate via `validateMarketplaceId()`
- All return `{ content: [{ type: 'text', text: JSON.stringify(...) }], structuredContent: ... }`
- All use `getSPAPIClient()` singleton for HTTP calls with named `rateLimitCategory`
- Pagination uses `NextToken` with safety limits (20-50 pages)

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `orders` | 1 | 5 |
| `orderItems` | 1 | 5 |
| `inventory` | 1 | 5 |
| `sales` | 1 | 5 |
| `catalog` | 1 | 5 |

### Error Handling

- API errors are propagated with additional context
- Input validation with Zod schemas
- `marketplaceId` validated against known list of IDs

---

## Next Steps

- Phase 2: Seller Management (Listings, Pricing, Fees)
