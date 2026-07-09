# Phase 2: Seller Management

**Status:** Implemented  
**Date:** 2026-07-08

Management tools for listings, competitive pricing, and fee estimation from Seller Central (SP-API).

---

## 1. Listings (5 tools)

### get_listing

- **Description:** Retrieve the full Listings Item document for a given seller SKU, including summaries, attributes, fulfillment availability, purchasable offer, and listing issues. Use before editing a listing.
- **Endpoint:** `GET /listings/2021-08-01/items/{sellerId}/{sku}`
- **Rate Limit Category:** `listings`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `sku` | `string` (min 1) | **Yes** | — | The seller SKU |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |
| `includedData` | `enum[]` | No | `[summaries, attributes, issues, fulfillmentAvailability, purchasableOffer]` | Datasets: summaries, attributes, issues, fulfillmentAvailability, purchasableOffer, productTypes, relationships, identifiers, images, salesRanks |

- **Response:** Complete `ListingsItem` object with the requested datasets.

---

### search_listings

- **Description:** Search the seller's listings by optional filters (status, sku, productType). Supports pagination with a cap of 20 pages.
- **Endpoint:** `GET /listings/2021-08-01/items/{sellerId}`
- **Rate Limit Category:** `listings`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |
| `status` | `string` | No | — | e.g. `BUYABLE`, `INCOMPLETE` |
| `sku` | `string` | No | — | Filter by SKU |
| `productType` | `string` | No | — | Filter by product type |
| `pageSize` | `integer` (1–100) | No | `20` | Results per page |
| `pageToken` | `string` | No | — | Pagination token |

- **Response:** `{ items: ItemSearchResult[], nextToken?: string }`

---

### put_listing

- **Description:** Create or fully replace a listing for a given SKU. **Destructive** — overwrites every field. Prefer `patch_listing` for incremental updates.
- **Endpoint:** `PUT /listings/2021-08-01/items/{sellerId}/{sku}`
- **Rate Limit Category:** `listings`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sku` | `string` (min 1) | **Yes** | Seller SKU |
| `productType` | `string` (min 1) | **Yes** | Amazon product type (e.g. `LUGGAGE`, `TOY`) |
| `marketplaceId` | `string` | No | Defaults to env var |
| `attributes` | `Record<string, unknown>` | No | Product-type-specific attributes |
| `fulfillmentAvailability` | `array` | No | See schema below |
| `purchasableOffer` | `array` | No | See schema below |
| `merchantSuggestedAsin` | `array` of `{asin, category?}` | No | Suggested ASINs |
| `condition` | `string` | No | e.g. `new_new` |

**fulfillmentAvailability item:**
```typescript
{
  fulfillmentChannelCode: "AMAZON" | "MERCHANT" | "DEFAULT",
  quantity?: number,           // int >= 0
  leadTimeToShipMaxDays?: number,  // int >= 0
  restockDate?: string
}
```

**purchasableOffer item:**
```typescript
{
  audience?: "ALL" | "B2B",
  quantity?: number,
  maxPrice?: { CurrencyCode: string, Amount: string },
  minimumSellerAllowedPrice?: { CurrencyCode: string, Amount: string },
  maximumSellerAllowedPrice?: { CurrencyCode: string, Amount: string }
}
```

- **Response:** `{ submissionId, sku, productType, ...ListingsItem }`

---

### patch_listing

- **Description:** Apply a partial update to an existing listing (JSON Merge Patch). Only the fields you provide are changed. If empty patch, returns "nothing to update" without calling Amazon.
- **Endpoint:** `PATCH /listings/2021-08-01/items/{sellerId}/{sku}`
- **Rate Limit Category:** `listings`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sku` | `string` (min 1) | **Yes** | Seller SKU |
| `marketplaceId` | `string` | No | Defaults to env var |
| `productType` | `string` (min 1) | No | Product type |
| `attributes` | `Record<string, unknown>` | No | Attributes to patch |
| `fulfillmentAvailability` | `array` | No | Same schema as put_listing |
| `purchasableOffer` | `array` | No | Same schema as put_listing |
| `merchantSuggestedAsin` | `array` | No | Same schema as put_listing |
| `condition` | `string` | No | Item condition |

- **Response:** `{ submissionId, sku }` or `{ sku, message: "Nothing to update" }`

---

### delete_listing

- **Description:** Delete a listing for a given SKU. **Permanent and irreversible.**
- **Endpoint:** `DELETE /listings/2021-08-01/items/{sellerId}/{sku}`
- **Rate Limit Category:** `listings`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sku` | `string` (min 1) | **Yes** | Seller SKU |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Response:** `{ sku, status }`

---

## 2. Pricing & Competition (2 tools)

### get_competitive_summary

- **Description:** Retrieve competitor pricing summary (featured offer price, lowest price, buy box price, number of offers) for 1-20 ASINs.
- **Endpoint:** `POST /products/pricing/2022-05-01/competitiveSummary`
- **Rate Limit Category:** `pricing`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `asin` | `string` | Mutually exclusive with `asins` | Single ASIN |
| `asins` | `string[]` (max 20) | Mutually exclusive with `asin` | Up to 20 ASINs |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Validation:** Exactly one of `asin` or `asins` must be provided.
- **Request body:** `{ asins, marketplaceId, includedData: ['featuredBuyingOptions', 'referencePrices', 'competitivePrices'] }`
- **Response:** `{ responses: CompetitiveSummaryResponse[] }`

---

### get_featured_offer_expected_price_batch

- **Description:** Retrieve the Featured Offer Expected Price (FOEP) for 1-40 SKUs. The FOEP is the price Amazon expects would win the Buy Box — useful for automated repricers.
- **Endpoint:** `POST /products/pricing/2022-05-01/featuredOfferExpectedPriceBatch`
- **Rate Limit Category:** `pricing`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sku` | `string` | Mutually exclusive with `skus` | Single SKU |
| `skus` | `string[]` (max 40) | Mutually exclusive with `sku` | Up to 40 SKUs |
| `price` | `{ currencyCode: string(3), amount: string }` | **Yes** | Current price for FOEP computation |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Validation:** Exactly one of `sku` or `skus` must be provided.
- **Request body:** `{ requests: [{ sellerId, marketplaceId, sku, expectedPrice }] }`
- **Response:** `{ responses: FeaturedOfferExpectedPriceBatchResponse['responses'] }`

---

## 3. Fees & Costs (2 tools in this module)

### get_fees_estimate_for_asin

- **Description:** Compute FBA fee estimates in real time for 1-20 ASINs at a given price. Use for live repricing; the report-based `get_fba_fee_estimates` is better for batch historical analysis.
- **Endpoint:** `POST /products/fees/v0/feesEstimate` (called once per ASIN in a loop)
- **Rate Limit Category:** `productFees`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `asin` | `string` | Mutually exclusive with `asins` | Single ASIN |
| `asins` | `string[]` (max 20) | Mutually exclusive with `asin` | Up to 20 ASINs |
| `price` | `{ currencyCode: string(3), amount: string }` | **Yes** | Price for fee calculation |
| `marketplaceId` | `string` | No | Defaults to env var |

- **Note:** Iterates sequentially over ASINs, making one POST per ASIN.
- **Response:** `{ results: FeesEstimateResponse[] }`

---

### get_fees_estimate_for_sku

- **Description:** Compute FBA fee estimate in real time for a single SKU at a given price and shipping speed.
- **Endpoint:** `POST /products/fees/v0/feesEstimate`
- **Rate Limit Category:** `productFees`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `sku` | `string` (min 1) | **Yes** | — | Seller SKU |
| `price` | `{ currencyCode: string(3), amount: string }` | **Yes** | — | Price for fee calculation |
| `shippingSpeed` | `enum` (`Standard`, `Expedited`, `Priority`) | No | `Standard` | Shipping speed |
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Request body:** `{ sku, marketplaceId, price: {currencyCode, amount}, shippingSpeed }`
- **Response:** `FeesEstimateResponse`

---

## Architecture

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `listings` | 1 | 5 |
| `pricing` | 1 | 5 |
| `productFees` | 1 | 5 |

### Error Handling

- API errors are propagated with additional context
- Input validation with Zod schemas
- Shared `moneySchema`: `{ currencyCode: string(3), amount: string(min 1) }`

---

## Next Steps

- Phase 3: Seller Finances (Finances, Invoices, Settlements)
