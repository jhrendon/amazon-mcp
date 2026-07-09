# Phase 9: Feeds API

**Status:** Planned
**Date:** 2026-07-09

Batch data upload tools for Seller Central (SP-API). Feeds allow bulk operations like updating listings, prices, inventory, and order confirmations.

---

## 1. Feeds (6 tools)

### get_feeds

- **Description:** List feeds submitted by the seller with optional filters by feed type, processing status, and date range.
- **Endpoint:** `GET /feeds/2021-06-30/feeds`
- **Rate Limit Category:** `feeds`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `feedTypes` | `string[]` | No | — | Filter by feed types (e.g. `POST_PRODUCT_DATA`, `POST_FLAT_FILE_PRICEANDQUANTITYONLY_UPDATE_DATA`) |
| `processingStatuses` | `enum[]` | No | — | Filter: `CANCELLED`, `DONE`, `FATAL`, `IN_PROGRESS`, `IN_QUEUE` |
| `marketplaceIds` | `string[]` | No | — | Filter by marketplace IDs |
| `pageSize` | `number` | No | `10` | Max results per page (max 100) |
| `createdSince` | `string` | No | — | ISO 8601 date |
| `createdUntil` | `string` | No | — | ISO 8601 date |
| `nextToken` | `string` | No | — | Pagination token |

- **Response:**
```json
{
  "feeds": [{
    "feedId": "1234567890",
    "feedType": "POST_PRODUCT_DATA",
    "processingStatus": "DONE",
    "createdTime": "2025-01-15T10:30:00Z",
    "processingStartTime": "2025-01-15T10:31:00Z",
    "processingEndTime": "2025-01-15T10:35:00Z",
    "resultFeedDocumentId": "amzn1.tortuga.4...",
    "marketplaceIds": ["ATVPDKIKX0DER"]
  }],
  "nextToken": null
}
```

---

### get_feed

- **Description:** Get information about a specific feed by feed ID.
- **Endpoint:** `GET /feeds/2021-06-30/feeds/{feedId}`
- **Rate Limit Category:** `feeds`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `feedId` | `string` | **Yes** | — | Feed ID |

- **Response:** Feed object (same schema as `get_feeds` individual item)

---

### create_feed

- **Description:** Create a new feed. Requires a feed document ID obtained from `create_feed_document`.
- **Endpoint:** `POST /feeds/2021-06-30/feeds`
- **Rate Limit Category:** `feeds`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `feedType` | `string` | **Yes** | — | Feed type (e.g. `POST_PRODUCT_DATA`) |
| `marketplaceIds` | `string[]` | **Yes** | — | Marketplace IDs |
| `inputFeedDocumentId` | `string` | **Yes** | — | Feed document ID from `create_feed_document` |
| `feedOptions` | `object` | No | — | Additional feed options |

- **Response:**
```json
{
  "feedId": "1234567890"
}
```

---

### cancel_feed

- **Description:** Cancel a feed that has not yet started processing.
- **Endpoint:** `DELETE /feeds/2021-06-30/feeds/{feedId}`
- **Rate Limit Category:** `feeds`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `feedId` | `string` | **Yes** | — | Feed ID |

- **Response:** Empty on success

---

### create_feed_document

- **Description:** Create a feed document for uploading feed content. Returns a pre-signed URL for upload.
- **Endpoint:** `POST /feeds/2021-06-30/documents`
- **Rate Limit Category:** `feeds`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `contentType` | `string` | **Yes** | — | Content type (e.g. `text/tab-separated-values`, `text/xml`) |

- **Response:**
```json
{
  "feedDocumentId": "amzn1.tortuga.4...",
  "url": "https://tortuga-prod-na.s3-external-1.amazonaws.com/...",
  "encryptionDetails": {
    "standard": "AES",
    "initializationVector": "...",
    "key": "..."
  }
}
```

---

### get_feed_document

- **Description:** Get the feed document (result) for a completed feed. Returns a pre-signed URL for download.
- **Endpoint:** `GET /feeds/2021-06-30/documents/{feedDocumentId}`
- **Rate Limit Category:** `feeds`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `feedDocumentId` | `string` | **Yes** | — | Feed document ID |

- **Response:**
```json
{
  "feedDocumentId": "amzn1.tortuga.4...",
  "url": "https://tortuga-prod-na.s3-external-1.amazonaws.com/...",
  "compressionAlgorithm": "GZIP"
}
```

---

## Architecture

### Feed Workflow

1. `create_feed_document` → get upload URL
2. Upload feed content to the pre-signed URL (PUT)
3. `create_feed` → submit the feed with the document ID
4. Poll `get_feed` until `DONE`/`FATAL`/`CANCELLED`
5. If `resultFeedDocumentId` exists → `get_feed_document` to download results

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `feeds` | 0.0222 | 10 |

### Common Feed Types

- `POST_PRODUCT_DATA` — Create/update product listings (XML)
- `POST_FLAT_FILE_LISTINGS_DATA` — Create/update listings (flat file)
- `POST_FLAT_FILE_PRICEANDQUANTITYONLY_UPDATE_DATA` — Update price and quantity only
- `POST_FLAT_FILE_INVLOADER_DATA` — Inventory loader
- `POST_ORDER_ACKNOWLEDGEMENT_DATA` — Confirm orders

---

## Next Steps

- Phase 10: FBA Inbound Complete
