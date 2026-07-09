# Phase 12: Negative Keywords & Targets (Ads)

**Status:** Planned
**Date:** 2026-07-09

Read and write tools for negative keywords and negative targets in Amazon Ads API (SP, SB, SD).

---

## 1. Negative Keywords Read (6 tools)

### sp_list_negative_keywords

- **Description:** List negative keywords for Sponsored Products campaigns.
- **Endpoint:** `GET /v2/sp/negativeKeywords`
- **Rate Limit Category:** `negativeKeywords`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `stateFilter` | `string` | No | — | Filter by state: `enabled`, `paused`, `archived` |
| `campaignIdFilter` | `string` | No | — | Filter by campaign ID |
| `adGroupIdFilter` | `string` | No | — | Filter by ad group ID |
| `keywordIdFilter` | `string` | No | — | Filter by keyword ID |
| `pageSize` | `number` | No | — | Results per page |
| `startIndex` | `number` | No | `0` | Starting index |

- **Response:**
```json
{
  "negativeKeywords": [{
    "keywordId": 1234567890,
    "campaignId": 987654321,
    "adGroupId": 111222333,
    "keywordText": "cheap",
    "matchType": "NEGATIVE_EXACT",
    "state": "enabled"
  }],
  "count": 1
}
```

---

### sp_get_negative_keyword

- **Description:** Get a specific negative keyword for Sponsored Products.
- **Endpoint:** `GET /v2/sp/negativeKeywords/{keywordId}`
- **Rate Limit Category:** `negativeKeywords`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `keywordId` | `number` | **Yes** | — | Negative keyword ID |

- **Response:** Negative keyword object

---

### sb_list_negative_keywords

- **Description:** List negative keywords for Sponsored Brands campaigns.
- **Endpoint:** `GET /v2/hs/negativeKeywords`
- **Rate Limit Category:** `negativeKeywords`
- **Note:** Requires Brand Registry.
- **Parameters:** `stateFilter`, `campaignIdFilter`, `adGroupIdFilter`, `keywordIdFilter`, `pageSize`, `startIndex`
- **Response:** Negative keywords list

---

### sb_get_negative_keyword

- **Description:** Get a specific negative keyword for Sponsored Brands.
- **Endpoint:** `GET /v2/hs/negativeKeywords/{keywordId}`
- **Rate Limit Category:** `negativeKeywords`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `keywordId` | `number` | **Yes** | — | Negative keyword ID |

- **Response:** Negative keyword object

---

### sd_list_negative_keywords

- **Description:** List negative keywords for Sponsored Display campaigns.
- **Endpoint:** `GET /sd/negativeKeywords`
- **Rate Limit Category:** `negativeKeywords`
- **Parameters:** `stateFilter`, `campaignIdFilter`, `adGroupIdFilter`, `keywordIdFilter`, `pageSize`, `startIndex`
- **Response:** Negative keywords list

---

### sd_get_negative_keyword

- **Description:** Get a specific negative keyword for Sponsored Display.
- **Endpoint:** `GET /sd/negativeKeywords/{keywordId}`
- **Rate Limit Category:** `negativeKeywords`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `keywordId` | `number` | **Yes** | — | Negative keyword ID |

- **Response:** Negative keyword object

---

## 2. Negative Targets Read (6 tools)

### sp_list_negative_targets

- **Description:** List negative targets for Sponsored Products campaigns.
- **Endpoint:** `GET /v2/sp/negativeTargets`
- **Rate Limit Category:** `negativeTargets`
- **Parameters:** `stateFilter`, `campaignIdFilter`, `adGroupIdFilter`, `targetIdFilter`, `pageSize`, `startIndex`
- **Response:** Negative targets list

---

### sp_get_negative_target

- **Description:** Get a specific negative target for Sponsored Products.
- **Endpoint:** `GET /v2/sp/negativeTargets/{targetId}`
- **Rate Limit Category:** `negativeTargets`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `targetId` | `number` | **Yes** | — | Negative target ID |

- **Response:** Negative target object

---

### sb_list_negative_targets

- **Description:** List negative targets for Sponsored Brands campaigns.
- **Endpoint:** `GET /v2/hs/negativeTargets`
- **Rate Limit Category:** `negativeTargets`
- **Parameters:** `stateFilter`, `campaignIdFilter`, `adGroupIdFilter`, `targetIdFilter`, `pageSize`, `startIndex`
- **Response:** Negative targets list

---

### sb_get_negative_target

- **Description:** Get a specific negative target for Sponsored Brands.
- **Endpoint:** `GET /v2/hs/negativeTargets/{targetId}`
- **Rate Limit Category:** `negativeTargets`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `targetId` | `number` | **Yes** | — | Negative target ID |

- **Response:** Negative target object

---

### sd_list_negative_targets

- **Description:** List negative targets for Sponsored Display campaigns.
- **Endpoint:** `GET /sd/negativeTargets`
- **Rate Limit Category:** `negativeTargets`
- **Parameters:** `stateFilter`, `campaignIdFilter`, `adGroupIdFilter`, `targetIdFilter`, `pageSize`, `startIndex`
- **Response:** Negative targets list

---

### sd_get_negative_target

- **Description:** Get a specific negative target for Sponsored Display.
- **Endpoint:** `GET /sd/negativeTargets/{targetId}`
- **Rate Limit Category:** `negativeTargets`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `targetId` | `number` | **Yes** | — | Negative target ID |

- **Response:** Negative target object

---

## 3. Negative Keywords Write (9 tools)

### sp_create_negative_keywords

- **Description:** Create negative keywords for Sponsored Products.
- **Endpoint:** `POST /v2/sp/negativeKeywords`
- **Rate Limit Category:** `negativeKeywords`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `negativeKeywords` | `array` | **Yes** | Array of `{ campaignId, adGroupId, keywordText, matchType, state }` |

- **Response:** Created negative keywords with IDs

---

### sp_update_negative_keywords

- **Description:** Update existing negative keywords (state, match type).
- **Endpoint:** `PUT /v2/sp/negativeKeywords`
- **Rate Limit Category:** `negativeKeywords`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `negativeKeywords` | `array` | **Yes** | Array of `{ keywordId, state, matchType }` |

- **Response:** Updated negative keywords

---

### sp_delete_negative_keywords

- **Description:** Archive (soft-delete) negative keywords.
- **Endpoint:** `DELETE /v2/sp/negativeKeywords`
- **Rate Limit Category:** `negativeKeywords`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `negativeKeywordIds` | `number[]` | **Yes** | Array of keyword IDs to archive |

- **Response:** Deleted negative keywords

---

### sb_create_negative_keywords

- **Description:** Create negative keywords for Sponsored Brands.
- **Endpoint:** `POST /v2/hs/negativeKeywords`
- **Rate Limit Category:** `negativeKeywords`
- **Response:** Created negative keywords with IDs

---

### sb_update_negative_keywords

- **Description:** Update existing negative keywords for Sponsored Brands.
- **Endpoint:** `PUT /v2/hs/negativeKeywords`
- **Rate Limit Category:** `negativeKeywords`
- **Response:** Updated negative keywords

---

### sb_delete_negative_keywords

- **Description:** Archive negative keywords for Sponsored Brands.
- **Endpoint:** `DELETE /v2/hs/negativeKeywords`
- **Rate Limit Category:** `negativeKeywords`
- **Response:** Deleted negative keywords

---

### sd_create_negative_keywords

- **Description:** Create negative keywords for Sponsored Display.
- **Endpoint:** `POST /sd/negativeKeywords`
- **Rate Limit Category:** `negativeKeywords`
- **Response:** Created negative keywords with IDs

---

### sd_update_negative_keywords

- **Description:** Update existing negative keywords for Sponsored Display.
- **Endpoint:** `PUT /sd/negativeKeywords`
- **Rate Limit Category:** `negativeKeywords`
- **Response:** Updated negative keywords

---

### sd_delete_negative_keywords

- **Description:** Archive negative keywords for Sponsored Display.
- **Endpoint:** `DELETE /sd/negativeKeywords`
- **Rate Limit Category:** `negativeKeywords`
- **Response:** Deleted negative keywords

---

## 4. Negative Targets Write (9 tools)

### sp_create_negative_targets

- **Description:** Create negative targets for Sponsored Products.
- **Endpoint:** `POST /v2/sp/negativeTargets`
- **Rate Limit Category:** `negativeTargets`
- **Response:** Created negative targets with IDs

---

### sp_update_negative_targets

- **Description:** Update existing negative targets for Sponsored Products.
- **Endpoint:** `PUT /v2/sp/negativeTargets`
- **Rate Limit Category:** `negativeTargets`
- **Response:** Updated negative targets

---

### sp_delete_negative_targets

- **Description:** Archive negative targets for Sponsored Products.
- **Endpoint:** `DELETE /v2/sp/negativeTargets`
- **Rate Limit Category:** `negativeTargets`
- **Response:** Deleted negative targets

---

### sb_create_negative_targets

- **Description:** Create negative targets for Sponsored Brands.
- **Endpoint:** `POST /v2/hs/negativeTargets`
- **Rate Limit Category:** `negativeTargets`
- **Response:** Created negative targets with IDs

---

### sb_update_negative_targets

- **Description:** Update existing negative targets for Sponsored Brands.
- **Endpoint:** `PUT /v2/hs/negativeTargets`
- **Rate Limit Category:** `negativeTargets`
- **Response:** Updated negative targets

---

### sb_delete_negative_targets

- **Description:** Archive negative targets for Sponsored Brands.
- **Endpoint:** `DELETE /v2/hs/negativeTargets`
- **Rate Limit Category:** `negativeTargets`
- **Response:** Deleted negative targets

---

### sd_create_negative_targets

- **Description:** Create negative targets for Sponsored Display.
- **Endpoint:** `POST /sd/negativeTargets`
- **Rate Limit Category:** `negativeTargets`
- **Response:** Created negative targets with IDs

---

### sd_update_negative_targets

- **Description:** Update existing negative targets for Sponsored Display.
- **Endpoint:** `PUT /sd/negativeTargets`
- **Rate Limit Category:** `negativeTargets`
- **Response:** Updated negative targets

---

### sd_delete_negative_targets

- **Description:** Archive negative targets for Sponsored Display.
- **Endpoint:** `DELETE /sd/negativeTargets`
- **Rate Limit Category:** `negativeTargets`
- **Response:** Deleted negative targets

---

## Architecture

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `negativeKeywords` | 2 | 10 |
| `negativeTargets` | 2 | 10 |

### Match Types for Negative Keywords

- `NEGATIVE_EXACT` — Block exact match only
- `NEGATIVE_PHRASE` — Block phrase match

---

## Next Steps

- Phase 13: Notifications API
