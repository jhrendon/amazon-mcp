# Phase 14: Product Pricing v0

**Status:** Planned
**Date:** 2026-07-09

Additional pricing tools using the Product Pricing v0 API. Complements the v2022-05-01 tools (competitive_summary, FOEP) from Phase 2.

---

## 1. Pricing (6 tools)

### get_pricing

- **Description:** Get pricing information for items (your price, lowest price, buy box price).
- **Endpoint:** `GET /products/pricing/v0/price`
- **Rate Limit Category:** `pricing`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `itemType` | `enum` | **Yes** | `Asin` or `Sku` |
| `asins` | `string[]` | No* | ASINs (max 20) |
| `skus` | `string[]` | No* | SKUs (max 20) |
| `itemCondition` | `enum` | No | `New`, `Used`, `Collectible`, `Refurbished`, `Club` |
| `offerType` | `enum` | No | `B2C` or `B2B` |

*\*Exactly one of `asins` or `skus` must be provided.*

- **Response:**
```json
{
  "pricing": [{
    "status": "Success",
    "asin": "B00EXAMPLE",
    "sku": "MY-SKU-001",
    "product": {
      "competitivePricing": {
        "competitivePrices": [],
        "numberOfOfferListings": [],
        "tradeInValue": null
      },
      "salesRankings": [],
      "offers": []
    }
  }]
}
```

---

### get_competitive_pricing

- **Description:** Get competitive pricing (lowest prices, buy box) for items.
- **Endpoint:** `GET /products/pricing/v0/competitivePrice`
- **Rate Limit Category:** `pricing`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `itemType` | `enum` | **Yes** | `Asin` or `Sku` |
| `asins` | `string[]` | No* | ASINs (max 20) |
| `skus` | `string[]` | No* | SKUs (max 20) |
| `itemCondition` | `enum` | No | `New`, `Used`, `Collectible`, `Refurbished`, `Club` |
| `offerType` | `enum` | No | `B2C` or `B2B` |

*\*Exactly one of `asins` or `skus` must be provided.*

- **Response:** Competitive pricing data with competitive prices and sales rankings

---

### get_listing_offers

- **Description:** Get all offers for a specific listing (by seller SKU).
- **Endpoint:** `GET /products/pricing/v0/listings/{sellerSKU}/offers`
- **Rate Limit Category:** `pricing`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sellerSKU` | `string` | **Yes** | Seller SKU |
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `itemCondition` | `enum` | **Yes** | Item condition |
| `customerType` | `enum` | No | `Consumer` or `Business` |

- **Response:**
```json
{
  "offers": [{
    "sellingPrice": { "amount": 29.99, "currencyCode": "USD" },
    "shippingCharge": { "amount": 0.00, "currencyCode": "USD" },
    "isFeaturedMerchant": true,
    "isBuyBoxWinner": true,
    "sellerId": "A1EXAMPLE",
    "conditionType": "New",
    "fulfillmentChannel": "AMAZON"
  }]
}
```

---

### get_item_offers

- **Description:** Get all offers for an item (by ASIN).
- **Endpoint:** `GET /products/pricing/v0/items/{asin}/offers`
- **Rate Limit Category:** `pricing`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `asin` | `string` | **Yes** | ASIN |
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `itemCondition` | `enum` | **Yes** | Item condition |
| `customerType` | `enum` | No | `Consumer` or `Business` |

- **Response:** Offers list (same schema as `get_listing_offers`)

---

### get_item_offers_batch

- **Description:** Get offers for multiple items in a single request (up to 20).
- **Endpoint:** `POST /batches/products/pricing/v0/itemOffers`
- **Rate Limit Category:** `pricing`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `requests` | `object[]` | **Yes** | Array of request objects (max 20) |

Each request object:

| Field | Type | Required | Description |
|---|---|---|---|
| `asin` | `string` | **Yes** | ASIN |
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `itemCondition` | `enum` | **Yes** | Item condition |
| `customerType` | `enum` | No | `Consumer` or `Business` |

- **Response:** Batch response with offers per request

---

### get_listing_offers_batch

- **Description:** Get offers for multiple listings in a single request (up to 20).
- **Endpoint:** `POST /batches/products/pricing/v0/listingOffers`
- **Rate Limit Category:** `pricing`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `requests` | `object[]` | **Yes** | Array of request objects (max 20) |

Each request object:

| Field | Type | Required | Description |
|---|---|---|---|
| `sellerSKU` | `string` | **Yes** | Seller SKU |
| `marketplaceId` | `string` | **Yes** | Marketplace ID |
| `itemCondition` | `enum` | **Yes** | Item condition |
| `customerType` | `enum` | No | `Consumer` or `Business` |

- **Response:** Batch response with offers per request

---

## Architecture

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `pricing` | 0.5 | 1 |

### Use Cases
- Price monitoring: track your prices vs. competitors across your catalog
- Buy box analysis: identify which offers win the buy box and why
- Batch repricing: use batch endpoints to efficiently gather pricing for large catalogs

---

## Next Steps

- Phase 15: Product Type Definitions
