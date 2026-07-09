# Phase 3: Seller Finances

**Status:** Implemented  
**Date:** 2026-07-08

Finance, invoice, and settlement report tools from Seller Central (SP-API).

---

## 1. Finances (3 tools)

### get_financial_events

- **Description:** Get financial events for a date range from Amazon Seller Central. Returns all financial events including sales, refunds, fees, reimbursements, and adjustments. Events are grouped by type for easy analysis.
- **Endpoint:** `GET /finances/v0/financialEvents`
- **Rate Limit Category:** `finances`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `postedAfter` | `string` | **Yes** | — | ISO 8601 date. Financial events posted after this date |
| `postedBefore` | `string` | No | — | ISO 8601 date. Financial events posted before this date |
| `maxResults` | `number` | No | `100` | Maximum results per page (max 100) |
| `nextToken` | `string` | No | — | Pagination token for next page |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:**
```json
{
  "totalEventCount": 150,
  "hasMore": false,
  "nextToken": null,
  "eventTypes": ["ShipmentEventList", "RefundEventList", "FeeEventList"],
  "financialEvents": {
    "ShipmentEventList": {
      "count": 100,
      "events": [...]
    },
    "RefundEventList": {
      "count": 30,
      "events": [...]
    },
    "FeeEventList": {
      "count": 20,
      "events": [...]
    }
  }
}
```

---

### get_financial_event_groups

- **Description:** Get financial event groups (payment disbursements). Shows grouped financial events including fund transfers, account balances, and settlement periods. Useful for tracking payments and reconciliation.
- **Endpoint:** `GET /finances/v0/financialEventGroups`
- **Rate Limit Category:** `finances`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `financialEventGroupStartedAfter` | `string` | **Yes** | — | ISO 8601 date. Event groups that started after this date |
| `financialEventGroupStartedBefore` | `string` | No | — | ISO 8601 date. Event groups that started before this date |
| `maxResults` | `number` | No | `10` | Maximum results per page (max 100) |
| `nextToken` | `string` | No | — | Pagination token for next page |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:**
```json
{
  "totalGroups": 5,
  "hasMore": false,
  "nextToken": null,
  "eventGroups": [{
    "financialEventGroupId": "group-123",
    "processingStatus": "Closed",
    "fundTransferStatus": "Successful",
    "originalTotal": { "currencyCode": "USD", "currencyAmount": 5000.00 },
    "convertedTotal": { "currencyCode": "USD", "currencyAmount": 5000.00 },
    "fundTransferDate": "2025-01-15T00:00:00Z",
    "traceId": "trace-123",
    "accountTail": "1234",
    "beginningBalance": { "currencyCode": "USD", "currencyAmount": 1000.00 },
    "financialEventGroupStart": "2025-01-01T00:00:00Z",
    "financialEventGroupEnd": "2025-01-14T23:59:59Z"
  }]
}
```

---

### get_order_financial_events

- **Description:** Get all financial events for a specific Amazon order. Returns detailed financial breakdown including the sale amount, fees, taxes, shipping charges, and any adjustments.
- **Endpoint:** `GET /finances/v0/orders/{orderId}/financialEvents`
- **Rate Limit Category:** `finances`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `orderId` | `string` (pattern: `^\d{3}-\d{7}-\d{7}$`) | **Yes** | — | Amazon order ID |
| `maxResults` | `number` | No | `100` | Maximum results per page (max 100) |
| `nextToken` | `string` | No | — | Pagination token for next page |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:**
```json
{
  "orderId": "111-1234567-1234567",
  "totalEventCount": 5,
  "hasMore": false,
  "nextToken": null,
  "eventTypes": ["ShipmentEventList", "FeeEventList"],
  "financialEvents": {
    "ShipmentEventList": {
      "count": 1,
      "events": [...]
    },
    "FeeEventList": {
      "count": 4,
      "events": [...]
    }
  }
}
```

---

## 2. Invoices (3 tools)

### get_invoices

- **Description:** List shipment invoices in a date range, optionally filtered by status. Returns invoice metadata (id, number, issueDate, totalAmount, currency, status, shipmentId).
- **Endpoint:** `GET /invoices/v0/invoices`
- **Rate Limit Category:** `invoices`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `postedAfter` | `string` | **Yes** | — | ISO 8601 date. Invoices posted after this date |
| `postedBefore` | `string` | No | — | ISO 8601 date. Invoices posted before this date |
| `statuses` | `enum[]` | No | — | Filter: `Payable`, `PayableWithFC`, `Failed`, `Cancelled`, `Processing` |
| `pageSize` | `number` (1–100) | No | `25` | Maximum results per page |
| `nextToken` | `string` | No | — | Pagination token |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:**
```json
{
  "invoices": [{
    "invoiceId": "inv-123",
    "invoiceNumber": "INV-2025-001",
    "issueDate": "2025-01-15",
    "totalAmount": { "currencyCode": "USD", "amount": "5000.00" },
    "status": "Payable",
    "shipmentId": "FBA1234"
  }],
  "nextToken": null
}
```

---

### get_invoice_document

- **Description:** Download a shipment invoice PDF. If the PDF is under 1 MB it is embedded as base64 in the response. If 1 MB or larger, the response contains only the presigned URL.
- **Endpoint:** `GET /invoices/v0/invoices/{invoiceId}/document`
- **Rate Limit Category:** `invoices`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `invoiceId` | `string` (min 1) | **Yes** | The invoice ID returned by get_invoices |

- **Response:**
```json
{
  "invoiceId": "inv-123",
  "document": {
    "url": "https://...",
    "downloaded": true,
    "base64": "JVBERi0xLjQK...",
    "sizeBytes": 524288
  }
}
```

- **Note:** `downloaded: true` means base64 is embedded. `downloaded: false` means use the URL.

---

### create_invoice

- **Description:** Generate a shipment invoice for an Amazon FBA shipment. Returns the new invoice id and number. **Invoices are permanent and may have tax implications.** Validate the shipment, the uniqueness of the invoiceNumber, and the line items before submitting.
- **Endpoint:** `PUT /fba/inventory/v1/invoices`
- **Rate Limit Category:** `invoices`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `shipmentId` | `string` (min 1) | **Yes** | The shipment ID to invoice |
| `invoiceNumber` | `string` (min 1) | **Yes** | Unique invoice number (must be unique per shipment) |
| `invoiceDate` | `string` | **Yes** | ISO 8601 date. The date the invoice is issued |
| `lineItems` | `array` (min 1) | **Yes** | At least one line item |
| `marketplaceId` | `string` | No | Defaults to env var |

**lineItems item:**
```typescript
{
  sku?: string,
  asin?: string,
  description: string,     // min 1
  quantity: number,        // positive integer
  unitPrice: {
    currencyCode: string,  // length 3
    amount: string         // min 1
  }
}
```

- **Response:**
```json
{
  "invoiceId": "inv-456",
  "invoiceNumber": "INV-2025-002"
}
```

---

## 3. Settlements (1 tool)

### get_settlement_report

- **Description:** Get settlement reports showing payment disbursements (order sales, refunds, fees, other charges). Settlement reports are auto-generated by Amazon on its own disbursement schedule and **CANNOT be requested on demand**. This lists already-generated settlement reports within the date range and aggregates them.
- **API Flow:** Custom (does not use report factory):
  1. `GET /reports/2021-06-30/reports?reportTypes=GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2,GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE&processingStatuses=DONE` (paginated, up to 2000 reports)
  2. Downloads each via `GET /reports/2021-06-30/documents/{reportDocumentId}`
  3. Deduplicates across V2/non-V2 by composite transaction key
- **Rate Limit Category:** `settlements`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `startDate` | `string` | **Yes** | Start date in YYYY-MM-DD format |
| `endDate` | `string` | **Yes** | End date in YYYY-MM-DD format |

- **Response:**
```json
{
  "summary": {
    "dateRange": { "start": "2025-01-01", "end": "2025-01-31" },
    "settlementReportsFound": 3,
    "settlementCount": 3,
    "totalTransactions": 500,
    "currency": "USD",
    "totalCredits": "15000.00",
    "totalDebits": "-3000.00",
    "netAmount": "12000.00",
    "incomplete": false,
    "failedReportCount": 0
  },
  "reports": [{ "reportId": "rpt-1", "period": "2025-01-01 to 2025-01-14" }],
  "byTransactionType": [{ "type": "Order", "count": 400, "amount": "12000.00" }],
  "byAmountType": [{ "type": "ItemPrice", "count": 400, "amount": "10000.00" }],
  "settlementIds": ["settlement-1", "settlement-2"],
  "recentTransactions": [{
    "settlementId": "settlement-1",
    "postedDate": "2025-01-15",
    "transactionType": "Order",
    "amountType": "ItemPrice",
    "amountDescription": "Product Name",
    "amount": "29.99",
    "orderId": "111-1234567-1234567",
    "sku": "MY-SKU-001"
  }]
}
```

---

## Architecture

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `finances` | 1 | 5 |
| `invoices` | 1 | 5 |
| `settlements` | 1 | 5 |

### Settlement Reports - Custom Flow

Unlike other report tools that use `_factory.ts`, `get_settlement_report` implements a custom flow:
1. Lists already-generated reports (cannot create new ones)
2. Supports both formats: V2 and legacy flat file
3. Deduplicates transactions using composite key
4. Aggregates by transaction type and amount type

---

## Next Steps

- Phase 4: Seller Operations (FBA Inbound, Merchant Fulfillment, Feedback, Data Kiosk, Tokens, Reports)
