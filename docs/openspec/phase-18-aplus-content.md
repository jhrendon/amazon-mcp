# Phase 18: A+ Content Management

**Status:** Planned
**Date:** 2026-07-09

Tools for managing A+ Content (Enhanced Brand Content) on Amazon product detail pages. Requires Brand Registry.

---

## 1. A+ Content (10 tools)

### search_content_documents

- **Description:** Search A+ content documents with optional filters.
- **Endpoint:** `GET /aplus/2020-11-01/contentDocuments`
- **Rate Limit Category:** `aplusContent`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `pageToken` | `string` | No | Pagination token |
| `locale` | `string` | No | Locale (e.g. `en_US`) |

- **Response:**
```json
{
  "contentMetadataRecords": [
    {
      "contentReferenceKey": "crk-12345",
      "contentType": "EBC",
      "name": "Product A+ Content",
      "status": "APPROVED",
      "badgeSet": ["STANDARD"]
    }
  ],
  "nextToken": null
}
```

---

### create_content_document

- **Description:** Create a new A+ content document.
- **Endpoint:** `POST /aplus/2020-11-01/contentDocuments`
- **Rate Limit Category:** `aplusContent`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `contentDocument` | `object` | **Yes** | Content document with name, contentType, contentModuleList, languageTag |

- **Response:**
```json
{
  "contentReferenceKey": "crk-12345"
}
```

---

### get_content_document

- **Description:** Get a specific A+ content document by reference key.
- **Endpoint:** `GET /aplus/2020-11-01/contentDocuments/{contentReferenceKey}`
- **Rate Limit Category:** `aplusContent`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `contentReferenceKey` | `string` | **Yes** | Content reference key |
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `includedDataSet` | `enum` | No | `CONTENTS`, `METADATA` |

- **Response:** Content document with modules and metadata

---

### update_content_document

- **Description:** Update an existing A+ content document.
- **Endpoint:** `POST /aplus/2020-11-01/contentDocuments/{contentReferenceKey}`
- **Rate Limit Category:** `aplusContent`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `contentReferenceKey` | `string` | **Yes** | Content reference key |
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `contentDocument` | `object` | **Yes** | Updated content document |

- **Response:** Empty on success

---

### list_content_document_asin_relations

- **Description:** List ASINs associated with an A+ content document.
- **Endpoint:** `GET /aplus/2020-11-01/contentDocuments/{contentReferenceKey}/asins`
- **Rate Limit Category:** `aplusContent`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `contentReferenceKey` | `string` | **Yes** | Content reference key |
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `includedDataSet` | `enum` | No | `METADATA` |
| `pageToken` | `string` | No | Pagination token |

- **Response:** List of ASINs linked to the content document

---

### post_content_document_asin_relations

- **Description:** Associate ASINs with an A+ content document.
- **Endpoint:** `POST /aplus/2020-11-01/contentDocuments/{contentReferenceKey}/asins`
- **Rate Limit Category:** `aplusContent`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `contentReferenceKey` | `string` | **Yes** | Content reference key |
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `asinSet` | `string[]` | **Yes** | ASINs to associate |

- **Response:** Empty on success

---

### validate_content_document_asin_relations

- **Description:** Validate ASIN associations for an A+ content document without saving.
- **Endpoint:** `POST /aplus/2020-11-01/contentAsinValidations`
- **Rate Limit Category:** `aplusContent`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `asinSet` | `string[]` | **Yes** | ASINs to validate |
| `contentDocument` | `object` | **Yes** | Content document to validate against |

- **Response:** Validation results with any errors or warnings

---

### search_content_publish_records

- **Description:** Search publish records for A+ content.
- **Endpoint:** `GET /aplus/2020-11-01/contentPublishRecords`
- **Rate Limit Category:** `aplusContent`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `asinSet` | `string[]` | No | Filter by ASINs |
| `pageToken` | `string` | No | Pagination token |

- **Response:** Publish records with content reference keys and publish metadata

---

### post_content_document_approval_submission

- **Description:** Submit an A+ content document for approval.
- **Endpoint:** `POST /aplus/2020-11-01/contentDocuments/{contentReferenceKey}/approvalSubmissions`
- **Rate Limit Category:** `aplusContent`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `contentReferenceKey` | `string` | **Yes** | Content reference key |
| `marketplaceId` | `string` | **Yes** | Marketplace ID |

- **Response:** Empty on success

---

### post_content_document_suspend_submission

- **Description:** Suspend a pending A+ content submission.
- **Endpoint:** `POST /aplus/2020-11-01/contentDocuments/{contentReferenceKey}/suspendSubmissions`
- **Rate Limit Category:** `aplusContent`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `contentReferenceKey` | `string` | **Yes** | Content reference key |
| `marketplaceId` | `string` | **Yes** | Marketplace ID |

- **Response:** Empty on success

---

## Architecture

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `aplusContent` | 10 | 10 |

### Content Types
- `EBC` — Enhanced Brand Content (standard A+)
- `EMC` — Enhanced Marketing Content

### Requirements
- Brand Registry required
- Content must pass validation before publishing
- ASIN associations link content to product pages

### Workflow
1. `create_content_document` → create A+ content with modules
2. `post_content_document_asin_relations` → associate ASINs
3. `validate_content_document_asin_relations` → validate before submission
4. `post_content_document_approval_submission` → submit for Amazon review
5. Monitor status via `search_content_documents` or `search_content_publish_records`

---

## Next Steps

- Phase 19: TBD
