# Phase 5: Ads Read

**Status:** Implemented  
**Date:** 2026-07-08

Read tools for the Amazon Ads API: Profiles, Sponsored Products, Sponsored Brands, Sponsored Display and Reports.

---

## 1. Profiles (2 tools)

### list_profiles

- **Description:** List all advertising profiles accessible with your credentials. Use to verify connection and see available profiles.
- **Endpoint:** `GET /v2/profiles`
- **Rate Limit Category:** `profiles`
- **Parameters:** `{}` (no parameters)
- **Response:**
```json
{
  "profiles": [{
    "profileId": 1234567890,
    "countryCode": "US",
    "currencyCode": "USD",
    "timezone": "America/Los_Angeles",
    "dailyBudget": 100.00,
    "accountInfo": {
      "marketplaceStringId": "ATVPDKIKX0DER",
      "id": "A1234567890",
      "type": "seller",
      "name": "My Store",
      "validPaymentMethod": true
    }
  }],
  "count": 1
}
```

---

### get_profile

- **Description:** Get details for a specific advertising profile by ID.
- **Endpoint:** `GET /v2/profiles/{profileId}`
- **Rate Limit Category:** `profiles`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `profileId` | `number` | **Yes** | Profile ID |

- **Response:** Profile object (same shape as list_profiles item)

---

## 2. Sponsored Products Read (10 tools)

### sp_list_campaigns

- **Endpoint:** `GET /v2/sp/campaigns`
- **Rate Limit Category:** `campaigns`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `stateFilter` | `enum` (`ENABLED`, `PAUSED`, `ARCHIVED`) | No | Filter by state |
| `campaignIdFilter` | `number[]` | No | Filter by campaign IDs |
| `pageSize` | `number` (1–1000) | No | Results per page |
| `startIndex` | `number` (≥0) | No | Start index for pagination |

- **Response:** `{ campaigns: [{ campaignId, name, campaignType, targetingType, state, dailyBudget, startDate, endDate, bidding }], count }`

### sp_get_campaign

- **Endpoint:** `GET /v2/sp/campaigns/{campaignId}`
- **Parameters:** `campaignId: number` (required)
- **Response:** Campaign object

### sp_list_ad_groups

- **Endpoint:** `GET /v2/sp/adGroups`
- **Rate Limit Category:** `adGroups`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `stateFilter` | `enum` | No | ENABLED, PAUSED, ARCHIVED |
| `campaignIdFilter` | `number[]` | No | Filter by campaign IDs |
| `adGroupIdFilter` | `number[]` | No | Filter by ad group IDs |
| `pageSize` | `number` (1–1000) | No | Results per page |
| `startIndex` | `number` (≥0) | No | Start index |

- **Response:** `{ adGroups: [{ adGroupId, campaignId, name, defaultBid, state }], count }`

### sp_get_ad_group

- **Endpoint:** `GET /v2/sp/adGroups/{adGroupId}`
- **Parameters:** `adGroupId: number` (required)
- **Response:** Ad group object

### sp_list_keywords

- **Endpoint:** `GET /v2/sp/keywords`
- **Rate Limit Category:** `keywords`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `stateFilter` | `enum` | No | ENABLED, PAUSED, ARCHIVED |
| `campaignIdFilter` | `number[]` | No | Filter by campaign IDs |
| `adGroupIdFilter` | `number[]` | No | Filter by ad group IDs |
| `keywordIdFilter` | `number[]` | No | Filter by keyword IDs |
| `matchTypeFilter` | `enum` (`EXACT`, `PHRASE`, `BROAD`) | No | Filter by match type |
| `pageSize` | `number` (1–1000) | No | Results per page |
| `startIndex` | `number` (≥0) | No | Start index |

- **Response:** `{ keywords: [{ keywordId, campaignId, adGroupId, keywordText, matchType, state, bid }], count }`

### sp_get_keyword

- **Endpoint:** `GET /v2/sp/keywords/{keywordId}`
- **Parameters:** `keywordId: number` (required)
- **Response:** Keyword object

### sp_list_targets

- **Endpoint:** `GET /v2/sp/targets`
- **Rate Limit Category:** `targets`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `stateFilter` | `enum` | No | ENABLED, PAUSED, ARCHIVED |
| `campaignIdFilter` | `number[]` | No | Filter by campaign IDs |
| `adGroupIdFilter` | `number[]` | No | Filter by ad group IDs |
| `pageSize` | `number` (1–1000) | No | Results per page |
| `startIndex` | `number` (≥0) | No | Start index |

- **Response:** `{ targets: [{ targetId, campaignId, adGroupId, state, expressionType, expression, bid }], count }`

### sp_get_target

- **Endpoint:** `GET /v2/sp/targets/{targetId}`
- **Parameters:** `targetId: number` (required)
- **Response:** Target object

### sp_list_product_ads

- **Endpoint:** `GET /v2/sp/productAds`
- **Rate Limit Category:** `productAds`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `stateFilter` | `enum` | No | ENABLED, PAUSED, ARCHIVED |
| `campaignIdFilter` | `number[]` | No | Filter by campaign IDs |
| `adGroupIdFilter` | `number[]` | No | Filter by ad group IDs |
| `pageSize` | `number` (1–1000) | No | Results per page |
| `startIndex` | `number` (≥0) | No | Start index |

- **Response:** `{ productAds: [{ adId, campaignId, adGroupId, asin, sku, state }], count }`

### sp_get_product_ad

- **Endpoint:** `GET /v2/sp/productAds/{adId}`
- **Parameters:** `adId: number` (required)
- **Response:** Product ad object

---

## 3. Sponsored Brands Read (6 tools)

**Note:** All SB tools require Brand Registry. Return 403 error with `BRAND_REGISTRY_REQUIRED` if not active.

### sb_list_campaigns

- **Endpoint:** `GET /v2/hs/campaigns`
- **Rate Limit Category:** `campaigns`
- **Parameters:** `stateFilter?`, `campaignIdFilter?`, `pageSize?`, `startIndex?`
- **Response:** `{ campaigns: [{ campaignId, name, campaignType, state, dailyBudget, startDate, endDate, bidding }], count }`

### sb_get_campaign

- **Endpoint:** `GET /v2/hs/campaigns/{campaignId}`
- **Parameters:** `campaignId: number` (required)

### sb_list_ad_groups

- **Endpoint:** `GET /v2/hs/adGroups`
- **Rate Limit Category:** `adGroups`
- **Parameters:** `stateFilter?`, `campaignIdFilter?`, `adGroupIdFilter?`, `pageSize?`, `startIndex?`
- **Response:** `{ adGroups: [{ adGroupId, campaignId, name, defaultBid, state }], count }`

### sb_get_ad_group

- **Endpoint:** `GET /v2/hs/adGroups/{adGroupId}`
- **Parameters:** `adGroupId: number` (required)

### sb_list_keywords

- **Endpoint:** `GET /v2/hs/keywords`
- **Rate Limit Category:** `keywords`
- **Parameters:** `stateFilter?`, `campaignIdFilter?`, `adGroupIdFilter?`, `keywordIdFilter?`, `matchTypeFilter?`, `pageSize?`, `startIndex?`
- **Response:** `{ keywords: [{ keywordId, campaignId, adGroupId, keywordText, matchType, state, bid }], count }`

### sb_get_keyword

- **Endpoint:** `GET /v2/hs/keywords/{keywordId}`
- **Parameters:** `keywordId: number` (required)

---

## 4. Sponsored Display Read (6 tools)

**Note:** SD uses endpoints without `/v2/` prefix.

### sd_list_campaigns

- **Endpoint:** `GET /sd/campaigns`
- **Rate Limit Category:** `campaigns`
- **Parameters:** `stateFilter?`, `campaignIdFilter?`, `pageSize?`, `startIndex?`
- **Response:** `{ campaigns: [{ campaignId, name, campaignType, state, dailyBudget, startDate, endDate, bidding }], count }`

### sd_get_campaign

- **Endpoint:** `GET /sd/campaigns/{campaignId}`
- **Parameters:** `campaignId: number` (required)

### sd_list_ad_groups

- **Endpoint:** `GET /sd/adGroups`
- **Rate Limit Category:** `adGroups`
- **Parameters:** `stateFilter?`, `campaignIdFilter?`, `adGroupIdFilter?`, `pageSize?`, `startIndex?`
- **Response:** `{ adGroups: [{ adGroupId, campaignId, name, defaultBid, state }], count }`

### sd_get_ad_group

- **Endpoint:** `GET /sd/adGroups/{adGroupId}`
- **Parameters:** `adGroupId: number` (required)

### sd_list_targets

- **Endpoint:** `GET /sd/targets`
- **Rate Limit Category:** `targets`
- **Parameters:** `stateFilter?`, `campaignIdFilter?`, `adGroupIdFilter?`, `pageSize?`, `startIndex?`
- **Response:** `{ targets: [{ targetId, campaignId, adGroupId, state, expressionType, expression, bid }], count }`

### sd_get_target

- **Endpoint:** `GET /sd/targets/{targetId}`
- **Parameters:** `targetId: number` (required)

---

## 5. Reports (12 tools)

Each family (SP, SB, SD) has 4 report tools: create, get_status, download, read.

### SP Reports

#### sp_create_report

- **Endpoint:** `POST /v2/sp/{reportType}/report`
- **Rate Limit Category:** `reports`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `reportType` | `enum` (`spCampaigns`, `spAdGroups`, `spKeywords`, `spTargets`, `spProductAds`) | **Yes** | Report type |
| `reportDate` | `string` | No | YYYYMMDD format |
| `segment` | `enum` (`campaign`, `adGroup`, `keyword`, `product`, `target`) | No | Segmentation |
| `metrics` | `string[]` | No | Metrics to include |

- **Response:** `{ reportId, recordId, message }`

#### sp_get_report_status

- **Endpoint:** `GET /v2/sp/reports/{reportId}`
- **Parameters:** `reportId: string` (required)
- **Response:** `{ reportId, status, statusDetails, location, fileSize, message }`

#### sp_download_report

- **Endpoint:** `GET /v2/sp/reports/{reportId}/download` (via `client.download`)
- **Parameters:** `reportId: string` (required), `outputPath?: string`
- **Response:** `{ reportId, outputPath, message }` — file is gzipped JSON

#### sp_read_report

- **Description:** Create, wait for, and read a report in one operation. Returns data directly.
- **Endpoints:** `POST /v2/sp/{reportType}/report` → polls `GET /v2/sp/reports/{reportId}` → downloads and decompresses
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `reportType` | `enum` (same as create) | **Yes** | — | Report type |
| `reportDate` | `string` | No | — | YYYYMMDD |
| `segment` | `enum` | No | — | Segmentation |
| `metrics` | `string[]` | No | — | Metrics |
| `maxWaitMs` | `number` | No | `300000` | Max wait time |

- **Response:** `{ reportId, recordId, data: [...], recordCount: number, message }`

### SB Reports

Same operations as SP but with `/v2/hs/` endpoints:

| Tool | Endpoint |
|---|---|
| `sb_create_report` | `POST /v2/hs/{reportType}/report` |
| `sb_get_report_status` | `GET /v2/hs/reports/{reportId}` |
| `sb_download_report` | `GET /v2/hs/reports/{reportId}/download` |
| `sb_read_report` | Create → poll → download (same flow) |

- **reportType enum:** `sbCampaigns`, `sbAdGroups`, `sbKeywords`
- **segment enum:** `campaign`, `adGroup`, `keyword`
- **Requires Brand Registry.** 403 → `BRAND_REGISTRY_REQUIRED`

### SD Reports

Same operations but with SD endpoints (without `/v2/`):

| Tool | Endpoint |
|---|---|
| `sd_create_report` | `POST /sd/{reportType}/report` |
| `sd_get_report_status` | `GET /sd/reports/{reportId}` |
| `sd_download_report` | `GET /sd/reports/{reportId}/download` |
| `sd_read_report` | Create → poll → download (same flow) |

- **reportType enum:** `sdCampaigns`, `sdAdGroups`, `sdTargets`
- **segment enum:** `campaign`, `adGroup`, `target`

---

## Architecture

### API Prefix Conventions

| Family | Prefix | Example |
|---|---|---|
| Sponsored Products | `/v2/sp/` | `/v2/sp/campaigns` |
| Sponsored Brands | `/v2/hs/` | `/v2/hs/campaigns` |
| Sponsored Display | `/sd/` | `/sd/campaigns` |
| Profiles | `/v2/profiles` | `/v2/profiles` |

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `profiles` | 2 | 10 |
| `campaigns` | 2 | 10 |
| `adGroups` | 2 | 10 |
| `keywords` | 2 | 10 |
| `targets` | 2 | 10 |
| `productAds` | 2 | 10 |
| `reports` | 1 | 5 |

### Brand Registry Handling

- All SB tools (read + reports) handle HTTP 403 with `BRAND_REGISTRY_REQUIRED` error
- Clear message: "Sponsored Brands API requires Brand Registry"

### Report Read Pattern

The `_read_report` tool is a synchronous wrapper that:
1. Creates the report (`POST`)
2. Polls until completion (`GET` with interval)
3. Downloads the file (`GET download`)
4. Decompresses gzip and parses JSON
5. Returns data directly

---

## Tools Summary

| # | Category | Tools | Count |
|---|---|---|---|
| 1 | Profiles | list_profiles, get_profile | 2 |
| 2 | SP Read | sp_list/get_campaigns, ad_groups, keywords, targets, product_ads | 10 |
| 3 | SB Read | sb_list/get_campaigns, ad_groups, keywords | 6 |
| 4 | SD Read | sd_list/get_campaigns, ad_groups, targets | 6 |
| 5 | SP Reports | sp_create/get_status/download/read_report | 4 |
| 6 | SB Reports | sb_create/get_status/download/read_report | 4 |
| 7 | SD Reports | sd_create/get_status/download/read_report | 4 |
| | **Total** | | **36** |

---

## Next Steps

- Phase 6: Ads Writes (campaign/ad group/keyword updates)