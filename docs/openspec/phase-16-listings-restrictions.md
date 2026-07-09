# Phase 16: Listings Restrictions

**Status:** Planned
**Date:** 2026-07-09

Tool to check listing restrictions before creating or editing listings.

---

## 1. Listings Restrictions (1 tool)

### get_listings_restrictions

- **Description:** Get listing restrictions for an item in the Amazon catalog. Check if a seller can list a product and what conditions apply.
- **Endpoint:** `GET /listings/2021-08-01/restrictions`
- **Rate Limit Category:** `listingsRestrictions`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `asin` | `string` | **Yes** | ASIN to check |
| `conditionType` | `enum` | No | `new_new`, `used_like_new`, `used_very_good`, `used_good`, `used_acceptable`, `collectible_like_new`, `collectible_very_good`, `collectible_good`, `collectible_acceptable`, `club`, `refurbished` |
| `sellerId` | `string` | **Yes** | Seller ID |
| `marketplaceIds` | `string[]` | **Yes** | Marketplace IDs |
| `reasonLocale` | `string` | No | Locale for restriction reasons (e.g. `en_US`) |

- **Response:**
```json
{
  "restrictions": [
    {
      "marketplaceId": "ATVPDKIKX0DER",
      "conditionType": "new_new",
      "reasons": [
        {
          "reasonCode": "APPROVAL_REQUIRED",
          "reasonDescription": "This product requires approval to list.",
          "links": [
            {
              "resource": "https://sellercentral.amazon.com/hz/approval/request",
              "verb": "GET",
              "title": "Apply for approval"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Architecture

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `listingsRestrictions` | 5 | 10 |

### Use Cases
- Before creating a listing: verify no restrictions block the listing
- Before editing: check if condition changes would trigger restrictions
- Approval workflows: get links to apply for restricted product categories

---

## Next Steps

- Phase 17: Sellers API
