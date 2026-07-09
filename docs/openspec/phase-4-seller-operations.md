# Phase 4: Seller Operations & Reports

**Status:** Implemented  
**Date:** 2026-07-08

Operations tools from Seller Central (SP-API): FBA Inbound, Merchant Fulfillment, Feedback, Solicitations, Data Kiosk, Tokens, and Asynchronous Reports.

---

## 1. FBA Inbound (5 tools)

### list_inbound_plans

- **Description:** List FBA inbound plans for the seller account with pagination support.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | No | Filter by plan status |
| `sortBy` | `string` | No | Field to sort by |
| `sortOrder` | `enum` (`ASC`, `DESC`) | No | Sort direction |
| `pageSize` | `number` (int, positive) | No | Results per page |
| `paginationToken` | `string` | No | Pagination token |
| `nextToken` | `string` | No | Alias for paginationToken |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Response:** `ListInboundPlansResponse`

---

### get_inbound_plan

- **Description:** Get detailed information about a specific FBA inbound plan.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `inboundPlanId` | `string` (min 1) | **Yes** | FBA inbound plan ID |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Response:** `InboundPlan`

---

### create_inbound_plan

- **Description:** Create a new FBA inbound plan with a source address and a list of items. Returns the created inbound plan ID.
- **Endpoint:** `POST /inbound/fba/2024-03-20/inboundPlans`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `marketplaceId` | `string` | **Yes** | Amazon marketplace ID |
| `originAddress` | `object` | **Yes** | Source address (see below) |
| `items` | `array` (min 1) | **Yes** | Inbound items (see below) |

**originAddress:**
```typescript
{
  name?: string,
  addressLine1: string,  // min 1
  addressLine2?: string,
  addressLine3?: string,
  city?: string,
  stateOrRegion?: string,
  postalCode?: string,
  countryCode?: string,  // len 2
  phone?: string
}
```

**items[]:**
```typescript
{
  asin?: string,
  sellerSku?: string,
  msKU?: string,
  quantity: number,       // int, positive
  labelOwner?: "AMAZON" | "SELLER",
  prepOwner?: "AMAZON" | "SELLER",
  expiration?: string,    // ISO 8601
  manufacturingLotCode?: string
}
```

- **Response:** `CreateInboundPlanResponse`

---

### list_inbound_plan_shipments

- **Description:** List shipments for a specific FBA inbound plan.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/shipments`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `inboundPlanId` | `string` (min 1) | **Yes** | FBA inbound plan ID |
| `pageSize` | `number` (int, positive) | No | Results per page |
| `paginationToken` | `string` | No | Pagination token |
| `nextToken` | `string` | No | Alias for paginationToken |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Response:** `ListInboundPlanShipmentsResponse`

---

### get_inbound_shipment

- **Description:** Get detailed information about a specific FBA inbound shipment.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/shipments/{shipmentId}`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `inboundPlanId` | `string` (min 1) | **Yes** | FBA inbound plan ID |
| `shipmentId` | `string` (min 1) | **Yes** | FBA inbound shipment ID |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Response:** `InboundShipment`

---

## 2. Merchant Fulfillment (4 tools)

### get_eligible_shipping_services

- **Description:** Get eligible shipping services for a merchant-fulfilled order, including rates and delivery promises.
- **Endpoint:** `POST /mfn/v0/eligibleShippingServices`
- **Rate Limit Category:** `merchantFulfillment`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `shipmentRequestDetails` | `object` | **Yes** | See shared schema below |
| `marketplaceId` | `string` | No | Defaults to env var |

**shipmentRequestDetails:**
```typescript
{
  amazonOrderId: string,           // min 1
  sellerOrderId?: string,
  itemList?: [{ orderItemId: string, quantity: number }],
  shipFromAddress: {               // required
    name?: string,
    addressLine1: string,          // min 1
    addressLine2?: string,
    addressLine3?: string,
    city: string,                  // min 1
    stateOrRegion: string,         // min 1
    postalCode: string,            // min 1
    countryCode: string,           // len 2
    phone?: string
  },
  packageDimensions: {             // required
    length: number,                // positive
    width: number,                 // positive
    height: number,                // positive
    unit: "inches" | "centimeters"
  },
  weight: {                        // required
    value: number,                 // positive
    unit: "ounces" | "grams" | "pounds" | "kilograms"
  },
  mustArriveByDate?: string,
  shipDate?: string,
  shippingServiceOptions: {        // required
    deliveryExperience: "DeliveryConfirmationWithAdultSignature" | "DeliveryConfirmationWithSignature" | "DeliveryConfirmationWithoutSignature" | "NoTracking",
    declaredValue?: { currencyCode: string(3), amount: number },
    carrierWillPickUp?: boolean,
    labelFormat?: "PDF" | "PNG" | "ZPL203" | "ZPL300" | "ShippingServiceDefault"
  },
  labelCustomization?: Record<string, unknown>
}
```

- **Response:** `GetEligibleShippingServicesResponse`

---

### create_shipment

- **Description:** Create a merchant fulfillment shipment (purchase a shipping label) for an order.
- **Endpoint:** `POST /mfn/v0/shipments`
- **Rate Limit Category:** `merchantFulfillment`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `shipmentRequestDetails` | `object` | **Yes** | Same schema as get_eligible_shipping_services |
| `shippingServiceId` | `string` (min 1) | **Yes** | Selected shipping service ID |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Response:** `CreateShipmentResponse`

---

### get_shipment

- **Description:** Get details of a merchant fulfillment shipment, including tracking and label information.
- **Endpoint:** `GET /mfn/v0/shipments/{shipmentId}`
- **Rate Limit Category:** `merchantFulfillment`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `shipmentId` | `string` (min 1) | **Yes** | Shipment ID |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Response:** `GetShipmentResponse`

---

### cancel_shipment

- **Description:** Cancel a merchant fulfillment shipment before the label is printed.
- **Endpoint:** `DELETE /mfn/v0/shipments/{shipmentId}`
- **Rate Limit Category:** `merchantFulfillment`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `shipmentId` | `string` (min 1) | **Yes** | Shipment ID |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Response:** `CancelShipmentResponse`

---

## 3. Feedback & Reviews (2 tools)

### get_feedback_insights_for_asin

- **Description:** Get item-level customer feedback insights (rating distribution and theme counts) for a single ASIN. **Requires Brand Registry**; 403 surfaced if missing.
- **Endpoint:** `GET /customerFeedback/2024-06-01/items/{asin}/insights`
- **Rate Limit Category:** `customerFeedback`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `asin` | `string` (min 1) | **Yes** | The ASIN to fetch feedback insights for |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Response:** `FeedbackInsightsResponse` (returns `{insights: []}` if empty)

---

### get_feedback_insights_for_browse_node

- **Description:** Get aggregated customer feedback insights (rating distribution and theme counts) for a browse node (category). **Requires Brand Registry.**
- **Endpoint:** `GET /customerFeedback/2024-06-01/browseNodes/{browseNodeId}/insights`
- **Rate Limit Category:** `customerFeedback`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `browseNodeId` | `string` (min 1) | **Yes** | The browse node (category) ID |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Response:** `FeedbackInsightsResponse`

---

## 4. Solicitations (2 tools)

### get_solicitation_actions_for_order

- **Description:** Discover which buyer solicitation actions are available for an order (e.g., productReviewAndSellerFeedback). Returns empty actions array if not yet eligible.
- **Endpoint:** `GET /messaging/v1/orders/{orderId}/solicitation/actions`
- **Rate Limit Category:** `solicitations`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` (pattern: `^\d{3}-\d{7}-\d{7}$`) | **Yes** | Amazon order ID |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Response:** `{ orderId: string, actions: SolicitationAction[] }`

---

### request_product_review

- **Description:** Request a product review from the buyer of a delivered order. The order must be in `Shipped` status — validates client-side first.
- **Endpoint:** `POST /messaging/v1/orders/{orderId}/solicitations/productReviewAndSellerFeedback`
- **Rate Limit Category:** `solicitations`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` (pattern: `^\d{3}-\d{7}-\d{7}$`) | **Yes** | Amazon order ID |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Response:** 200 on success, or a clear refusal if the order is not yet shipped.

---

## 5. Data Kiosk (3 tools)

### create_data_kiosk_query

- **Description:** Create a Data Kiosk query from a GraphQL query document.
- **Endpoint:** `POST /dataKiosk/2023-11-15/queries`
- **Rate Limit Category:** `dataKiosk`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | `string` (min 1) | **Yes** | GraphQL query document |
| `pageSize` | `number` (int, positive) | No | Maximum results per page |

- **Response:** `{ queryId: string }`

---

### get_data_kiosk_query

- **Description:** Get the status of a Data Kiosk query. When the query is DONE, the document is downloaded and parsed.
- **Endpoint:** `GET /dataKiosk/2023-11-15/queries/{queryId}`
- **Rate Limit Category:** `dataKiosk`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `queryId` | `string` (min 1) | **Yes** | Data Kiosk query ID |

- **Response:** Query status with document data when DONE.

---

### list_data_kiosk_queries

- **Description:** List Data Kiosk queries with pagination support.
- **Endpoint:** `GET /dataKiosk/2023-11-15/queries`
- **Rate Limit Category:** `dataKiosk`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `processingStatuses` | `string[]` | No | Filter by processing statuses |
| `pageSize` | `number` (int, positive) | No | Maximum results per page |
| `paginationToken` | `string` | No | Pagination token |
| `nextToken` | `string` | No | Alias for paginationToken |

- **Response:** List of queries with pagination info.

---

## 6. Tokens (1 tool)

### create_restricted_data_token

- **Description:** Create a restricted data token (RDT) for accessing PII such as buyer info or shipping addresses on the target SP-API path.
- **Endpoint:** `POST /tokens/2021-03-01/restrictedDataToken`
- **Rate Limit Category:** `tokens`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `targetPath` | `string` (min 1) | **Yes** | — | SP-API path (e.g. `/orders/v0/orders`) |
| `dataElements` | `string[]` (min 1) | **Yes** | — | Data elements: `buyerInfo`, `shippingAddress` |
| `method` | `enum` (`GET`, `POST`, `PUT`, `DELETE`) | No | `GET` | HTTP method for the restricted resource |
| `marketplaceId` | `string` | No | — | Optional marketplace context |

- **Response:** `{ restrictedDataToken: string, expiresInSeconds: number }`

---

## 7. FBA Reports (7 tools via report factory)

All report tools use the `_factory.ts` pattern:
1. `POST /reports/2021-06-30/reports` — create report request
2. `GET /reports/2021-06-30/reports/{reportId}` — poll until `DONE`/`CANCELLED`/`FATAL`
3. `GET /reports/2021-06-30/documents/{reportDocumentId}` — get pre-signed download URL
4. Download + decompress (GZIP) the TSV document
5. Parse CSV → run `summary()` function → return structured JSON

### get_fba_reimbursements

- **Report Type:** `GET_FBA_REIMBURSEMENTS_DATA`
- **Input:** `startDate` (required), `endDate` (required)
- **Poll:** maxWait 300s, interval 15s
- **Response:**
```json
{
  "summary": { "dateRange": {}, "totalReimbursements": 10, "totalAmount": { "amount": "150.00", "currencyCode": "USD" } },
  "byReason": [{ "reason": "Damaged", "count": 5, "amount": "75.00" }],
  "bySku": [{ "sku": "SKU-001", "productName": "...", "count": 3, "amount": "50.00" }],
  "recentReimbursements": [{ "reimbursementId": "...", "approvalDate": "...", "reason": "...", "sku": "...", "asin": "...", "productName": "...", "quantity": 1, "amount": "25.00", "amazonOrderId": "...", "caseId": "..." }]
}
```

### get_fba_customer_returns

- **Report Type:** `GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA`
- **Input:** `startDate` (required), `endDate` (required)
- **Response:**
```json
{
  "summary": { "dateRange": {}, "totalReturns": 20, "totalQuantityReturned": 25 },
  "byReason": [{ "reason": "Defective", "count": 10, "quantity": 12 }],
  "bySku": [{ "sku": "SKU-001", "productName": "...", "count": 5, "quantity": 6 }],
  "recentReturns": [{ "returnDate": "...", "orderId": "...", "sku": "...", "asin": "...", "productName": "...", "quantity": 1, "reason": "...", "status": "...", "fulfillmentCenter": "..." }]
}
```

### get_fba_inventory_planning

- **Report Type:** `GET_FBA_INVENTORY_PLANNING_DATA`
- **Input:** `startDate` (required), `endDate` (required)
- **Response:**
```json
{
  "summary": { "totalSkus": 50, "totalAvailable": 1000, "totalInbound": 200, "totalReserved": 50, "lowStockCount": 5 },
  "lowStock": [{ "sku": "...", "asin": "...", "productName": "...", "availableQuantity": 10, "daysOfSupply": 15, "recommendedOrderQty": 100, "recommendedOrderDate": "...", "recommendedAction": "Reorder" }],
  "planningDetails": [{ "sku": "...", "asin": "...", "productName": "...", "condition": "...", "availableQuantity": 50, "inboundQuantity": 20, "reservedQuantity": 5, "totalInbound": 20, "daysOfSupply": 60, "recommendedAction": "...", "recommendedOrderQty": 0, "recommendedOrderDate": "..." }]
}
```

### get_inventory_ledger

- **Report Type:** `GET_LEDGER_SUMMARY_VIEW_DATA`
- **Input:** `startDate` (required), `endDate` (required)
- **Response:**
```json
{
  "summary": { "dateRange": {}, "totalSkus": 50, "totals": { "receipts": 200, "customerShipments": 150, "customerReturns": 10, "lost": 2, "damaged": 1, "disposed": 0, "found": 1 } },
  "byAsin": [{ "asin": "...", "title": "...", "startingBalance": 100, "endingBalance": 140, "receipts": 50, "shipments": 30, "returns": 5, "netAdjustments": 15 }],
  "ledgerDetails": [{ "date": "...", "asin": "...", "fnsku": "...", "sku": "...", "title": "...", "disposition": "...", "startingBalance": 100, "endingBalance": 110, "movements": { "receipts": 10, "customerShipments": 5, "customerReturns": 1, "found": 0, "lost": 0, "damaged": 0, "disposed": 0, "other": 4 } }]
}
```

### get_inventory_ledger_detail

- **Report Type:** `GET_LEDGER_DETAIL_VIEW_DATA`
- **Input:** `startDate` (required), `endDate` (required)
- **Response:**
```json
{
  "summary": { "dateRange": {}, "totalTransactions": 500, "byEventType": { "CustomerShipment": { "count": 150, "quantity": 150 } } },
  "byAsin": [{ "asin": "...", "title": "...", "netQuantity": 50 }],
  "ledgerDetails": [{ "date": "...", "fnsku": "...", "asin": "...", "msku": "...", "title": "...", "disposition": "...", "eventType": "...", "quantity": 1, "referenceId": "...", "location": "..." }]
}
```

---

## 8. Fee Reports (3 tools via report factory)

### get_fba_fee_estimates

- **Report Type:** `GET_FBA_ESTIMATED_FBA_FEES_TXT_DATA`
- **Input:** `{}` (no parameters — point-in-time snapshot)
- **requiresDateRange:** `false`
- **Response:**
```json
{
  "summary": { "totalSkus": 50, "currency": "USD", "totalEstimatedFees": "5000.00", "averageFeePerSku": "100.00" },
  "byProductSizeTier": [{ "tier": "SmallStandard", "skuCount": 20, "averageFee": "5.00", "totalFee": "100.00" }],
  "feeEstimates": [{ "sku": "...", "asin": "...", "productName": "...", "productSizeTier": "...", "yourPrice": "29.99", "estimatedFeeTotal": "8.50", "feeBreakdown": { "referralFee": "4.50", "fulfillmentFee": "3.00", "pickPackFee": "0.50", "weightHandlingFee": "0.50", "variableClosingFee": "0.00" }, "dimensions": { "longest": 10, "median": 8, "shortest": 5, "unit": "inches" }, "weight": { "value": 1.5, "unit": "pounds" } }]
}
```

### get_storage_fees

- **Report Type:** `GET_FBA_STORAGE_FEE_CHARGES_DATA`
- **Input:** `startDate` (required), `endDate` (required)
- **Response:**
```json
{
  "summary": { "dateRange": {}, "totalSkus": 50, "currency": "USD", "totalStorageFees": "2500.00", "totalVolume": "100.00" },
  "byProductSizeTier": [{ "tier": "SmallStandard", "skuCount": 20, "totalFee": "1000.00", "totalVolume": "40.00" }],
  "storageFees": [{ "asin": "...", "fnsku": "...", "productName": "...", "productSizeTier": "...", "avgQuantityOnHand": 50, "estimatedVolume": "2.50", "volumeUnits": "cubic feet", "monthOfCharge": "2025-01", "storageUtilizationRatio": "0.75", "baseRate": "0.87", "estimatedMonthlyStorageFee": "2.18" }]
}
```

### get_longterm_storage_fees

- **Report Type:** `GET_FBA_FULFILLMENT_LONGTERM_STORAGE_FEE_CHARGES_DATA`
- **Input:** `startDate` (required), `endDate` (required)
- **Response:**
```json
{
  "summary": { "dateRange": {}, "totalSkusWithLTSF": 5, "currency": "USD", "total12MonthFees": "500.00", "total6MonthFees": "200.00", "totalFees": "700.00", "totalAgedUnits12Mo": 10, "totalAgedUnits6Mo": 15 },
  "ltsfDetails": [{ "snapshotDate": "...", "sku": "...", "asin": "...", "productName": "...", "condition": "...", "surchargeAgeTier": "12-month", "perUnitVolume": "6.90", "volumeUnit": "cubic feet", "charges12Month": { "quantity": 5, "fee": "250.00" }, "charges6Month": { "quantity": 10, "fee": "200.00" } }]
}
```

---

## 9. Analytics Reports (3 tools via report factory)

### get_sales_traffic_report

- **Report Type:** `GET_SALES_AND_TRAFFIC_REPORT`
- **Input:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `startDate` | `string` | **Yes** | — | YYYY-MM-DD |
| `endDate` | `string` | **Yes** | — | YYYY-MM-DD |
| `reportOptions.dateGranularity` | `enum` (`DAY`, `WEEK`, `MONTH`) | No | `DAY` | Date granularity |
| `reportOptions.asinGranularity` | `enum` (`PARENT`, `CHILD`, `SKU`) | No | `PARENT` | ASIN granularity |

- **Report Options sent:** `{ dateGranularity, asinGranularity }`
- **Response:**
```json
{
  "summary": { "dateRange": {}, "granularity": "DAY", "totalSessions": 5000, "totalPageViews": 15000, "totalUnitsOrdered": 500, "totalSales": "15000.00", "averageConversionRate": "10.00%" },
  "topProducts": [{ "asin": "...", "title": "...", "sessions": 1000, "pageViews": 3000, "unitsOrdered": 100, "sales": "3000.00", "conversionRate": "10.00%", "avgBuyBoxPercentage": "95.00%" }],
  "dailyData": [{ "date": "...", "asin": "...", "title": "...", "sessions": 100, "pageViews": 300, "buyBoxPercentage": "95.00%", "unitsOrdered": 10, "unitSessionPercentage": "10.00%", "orderedProductSales": "300.00" }]
}
```

### get_search_terms_report

- **Report Type:** `GET_BRAND_ANALYTICS_SEARCH_TERMS_REPORT`
- **Input:** `startDate` (required), `endDate` (required)
- **Requires:** Brand Registry
- **Response:**
```json
{
  "summary": { "dateRange": {}, "totalSearchTerms": 500 },
  "searchTerms": [{ "reportingDate": "...", "searchTerm": "wireless headphones", "searchFrequencyRank": 150, "topClickedAsins": [{ "asin": "...", "title": "...", "clickShare": "15.00%", "conversionShare": "10.00%" }] }]
}
```

---

## 10. Brand Analytics Reports (2 tools via report factory)

### get_market_basket_report

- **Report Type:** `GET_BRAND_ANALYTICS_MARKET_BASKET_REPORT`
- **Input:** `startDate` (required), `endDate` (required)
- **Requires:** Brand Registry
- **Response:**
```json
{
  "summary": { "dateRange": {}, "totalMarketBaskets": 1000, "productsWithBaskets": 50 },
  "marketBaskets": [{ "asin": "...", "title": "...", "frequentlyPurchasedWith": [{ "asin": "...", "title": "...", "percentage": "25.00%" }] }]
}
```

### get_repeat_purchase_report

- **Report Type:** `GET_BRAND_ANALYTICS_REPEAT_PURCHASE_REPORT`
- **Input:** `startDate` (required), `endDate` (required)
- **Requires:** Brand Registry
- **Response:**
```json
{
  "summary": { "dateRange": {}, "totalSearchTerms": 200, "totalRecords": 500 },
  "bySearchTerm": [{ "searchTerm": "...", "uniqueCustomers": 1000, "repeatCustomers": 200, "repeatPurchaseRate": "20.00%" }],
  "repeatPurchaseDetails": [{ "reportingDate": "...", "searchTerm": "...", "brandName": "...", "uniqueCustomers": 1000, "repeatCustomers": 200, "repeatPurchaseRate": "20.00%" }]
}
```

---

## 11. Additional Reports (1 tool via report factory)

### get_all_orders_report

- **Report Type:** `GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL`
- **Input:** `startDate` (required), `endDate` (required)
- **Response:**
```json
{
  "summary": { "dateRange": {}, "totalOrders": 500, "totalOrderItems": 600, "totalQuantity": 700, "totalRevenue": "20000.00" },
  "byStatus": [{ "status": "Shipped", "count": 450, "quantity": 650, "revenue": "19000.00" }],
  "bySku": [{ "sku": "...", "productName": "...", "count": 50, "quantity": 60, "revenue": "2000.00" }],
  "recentOrders": [{ "orderId": "...", "orderDate": "...", "orderStatus": "...", "sku": "...", "asin": "...", "productName": "...", "quantity": 1, "itemPrice": "29.99", "shipCountry": "US" }]
}
```

---

## Architecture

### Report Factory Pattern (`_factory.ts`)

```typescript
interface ReportToolOptions<TInput, TRecord> {
  description: string;
  reportType: string;
  inputSchema: z.ZodType<TInput>;
  summary: (records: TRecord[], input: TInput) => unknown;
  pollOptions?: PollOptions;
  csvOptions?: CSVParserConfig;
  reportOptions?: Record<string, string> | ((input: TInput) => Record<string, string>);
  requiresDateRange?: boolean;  // default: true
}
```

**Flow:**
1. `POST /reports/2021-06-30/reports` — create report (with `reportType`, `dataStartTime`, `dataEndTime`, `marketplaceIds`, `reportOptions`)
2. `GET /reports/2021-06-30/reports/{reportId}` — poll until `DONE`/`CANCELLED`/`FATAL`
3. `GET /reports/2021-06-30/documents/{reportDocumentId}` — get pre-signed download URL
4. Download + decompress (GZIP) the TSV document
5. Parse CSV → run `summary()` function → return structured JSON

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `fbaInbound` | 1 | 5 |
| `merchantFulfillment` | 1 | 5 |
| `customerFeedback` | 1 | 5 |
| `solicitations` | 1 | 5 |
| `dataKiosk` | 1 | 5 |
| `tokens` | 1 | 5 |
| `reports` | 1 | 5 |

### Error Handling

- Brand Registry tools (feedback, search terms, market basket, repeat purchase) return 403 with clear message if Brand Registry is not active
- Report factory handles `CANCELLED` and `FATAL` statuses with appropriate error messages
- All tools validate inputs with Zod schemas

---

## Tools Summary

| # | Category | Tools | Count |
|---|---|---|---|
| 1 | FBA Inbound | list_inbound_plans, get_inbound_plan, create_inbound_plan, list_inbound_plan_shipments, get_inbound_shipment | 5 |
| 2 | Merchant Fulfillment | get_eligible_shipping_services, create_shipment, get_shipment, cancel_shipment | 4 |
| 3 | Feedback | get_feedback_insights_for_asin, get_feedback_insights_for_browse_node | 2 |
| 4 | Solicitations | get_solicitation_actions_for_order, request_product_review | 2 |
| 5 | Data Kiosk | create_data_kiosk_query, get_data_kiosk_query, list_data_kiosk_queries | 3 |
| 6 | Tokens | create_restricted_data_token | 1 |
| 7 | FBA Reports | get_fba_reimbursements, get_fba_customer_returns, get_fba_inventory_planning, get_inventory_ledger, get_inventory_ledger_detail | 5 |
| 8 | Fee Reports | get_fba_fee_estimates, get_storage_fees, get_longterm_storage_fees | 3 |
| 9 | Analytics Reports | get_sales_traffic_report, get_search_terms_report | 2 |
| 10 | Brand Analytics | get_market_basket_report, get_repeat_purchase_report | 2 |
| 11 | Additional Reports | get_all_orders_report | 1 |
| | **Total** | | **30** |

---

## Next Steps

- Phase 5: Ads Read (Profiles, SP/SB/SD read, Reports)
