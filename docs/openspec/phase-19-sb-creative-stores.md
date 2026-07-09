# Phase 19: Sponsored Brands Creative, Stores & Video

**Status:** Planned  
**Date:** 2026-07-09

Tools for managing Sponsored Brands creative assets, store pages, and video campaigns. Requires Brand Registry.

---

## 1. SB Stores (3 tools)

### sb_list_stores

- **Description:** List all Amazon Stores associated with the advertising account.
- **Endpoint:** `GET /stores/v0/stores`
- **Rate Limit Category:** `sbStores`
- **Parameters:** `{}` (no parameters)
- **Response:**
```json
{
  "stores": [
    {
      "brandEntityId": "BRAND123",
      "storePageId": "page-abc",
      "storeName": "My Brand Store",
      "storeVersion": 3
    }
  ],
  "count": 1
}
```

---

### sb_get_store

- **Description:** Get details for a specific store including pages and layout.
- **Endpoint:** `GET /stores/v0/stores/{brandEntityId}`
- **Rate Limit Category:** `sbStores`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `brandEntityId` | `string` | **Yes** | Brand entity ID |

- **Response:** Store object with pages, tiles, and layout

---

### sb_get_store_asin_list

- **Description:** Get all ASINs featured in a store.
- **Endpoint:** `GET /stores/v0/stores/{brandEntityId}/asins`
- **Rate Limit Category:** `sbStores`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `brandEntityId` | `string` | **Yes** | Brand entity ID |

- **Response:** List of ASINs featured in the store

---

## 2. SB Creative Assets (4 tools)

### sb_upload_image

- **Description:** Upload an image asset for use in SB campaigns.
- **Endpoint:** `POST /v2/hs/media/upload`
- **Rate Limit Category:** `sbCreative`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `mediaType` | `enum` (`image`) | **Yes** | Media type |
| `programType` | `enum` (`SB`) | **Yes** | Program type |
| `creativeType` | `enum` (`BRAND_LOGO`, `BRAND_HEADLINE`) | **Yes** | Creative type |

- **Response:**
```json
{
  "mediaId": "media-xyz-123",
  "status": "PROCESSING"
}
```

---

### sb_upload_video

- **Description:** Upload a video asset for SB Video campaigns.
- **Endpoint:** `POST /v2/hs/media/upload`
- **Rate Limit Category:** `sbCreative`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `mediaType` | `enum` (`video`) | **Yes** | Media type |
| `programType` | `enum` (`SBV`) | **Yes** | Program type |

- **Response:**
```json
{
  "mediaId": "media-vid-456",
  "status": "PROCESSING"
}
```

---

### sb_get_media_status

- **Description:** Check the processing status of an uploaded media asset.
- **Endpoint:** `GET /v2/hs/media/{mediaId}`
- **Rate Limit Category:** `sbCreative`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `mediaId` | `string` | **Yes** | Media ID from upload response |

- **Response:** `{ mediaId, status, statusDetails }` where status is `PROCESSING`, `AVAILABLE`, or `FAILED`

---

### sb_list_media

- **Description:** List all media assets in the account.
- **Endpoint:** `GET /v2/hs/media`
- **Rate Limit Category:** `sbCreative`
- **Parameters:** `{}` (no parameters)
- **Response:** `{ media: [{ mediaId, mediaType, status, createdAt }], count }`

---

## 3. SB Landing Pages (2 tools)

### sb_list_landing_pages

- **Description:** List landing pages available for SB campaigns.
- **Endpoint:** `GET /v2/hs/landingPages`
- **Rate Limit Category:** `sbLandingPages`
- **Parameters:** `{}` (no parameters)
- **Response:** `{ landingPages: [{ landingPageId, name, url, status }], count }`

---

### sb_get_landing_page

- **Description:** Get details for a specific landing page.
- **Endpoint:** `GET /v2/hs/landingPages/{landingPageId}`
- **Rate Limit Category:** `sbLandingPages`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `landingPageId` | `string` | **Yes** | Landing page ID |

- **Response:** Landing page object with layout, tiles, and ASINs

---

## Architecture

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `sbStores` | 2 | 10 |
| `sbCreative` | 2 | 10 |
| `sbLandingPages` | 2 | 10 |

### Requirements

- All tools require Brand Registry
- Media uploads are async — poll `sb_get_media_status` until status is `AVAILABLE`
- Video must meet Amazon's creative guidelines (duration, format, resolution)

---

## Tools Summary

| # | Category | Tools | Count |
|---|---|---|---|
| 1 | SB Stores | sb_list_stores, sb_get_store, sb_get_store_asin_list | 3 |
| 2 | SB Creative Assets | sb_upload_image, sb_upload_video, sb_get_media_status, sb_list_media | 4 |
| 3 | SB Landing Pages | sb_list_landing_pages, sb_get_landing_page | 2 |
| | **Total** | | **9** |

---

## Next Steps

- Phase 20: Budget & Bid Recommendations
