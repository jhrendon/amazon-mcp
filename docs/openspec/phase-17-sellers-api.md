# Phase 17: Sellers API

**Status:** Planned
**Date:** 2026-07-09

Tools to retrieve seller account information and marketplace participations.

---

## 1. Sellers (2 tools)

### get_marketplace_participations

- **Description:** Get a list of marketplaces that the seller account can sell in, along with participation status.
- **Endpoint:** `GET /sellers/v1/marketplaceParticipations`
- **Rate Limit Category:** `sellers`
- **Parameters:** None (uses auth context)

- **Response:**
```json
{
  "participations": [
    {
      "marketplace": {
        "id": "ATVPDKIKX0DER",
        "name": "Amazon.com",
        "countryCode": "US",
        "defaultCurrencyCode": "USD",
        "defaultLanguageCode": "en_US",
        "domainName": "www.amazon.com"
      },
      "participation": {
        "isParticipating": true,
        "hasSuspendedListings": false
      }
    }
  ]
}
```

---

### get_account

- **Description:** Get the seller's account information including business type and selling plan.
- **Endpoint:** `GET /sellers/v1/account`
- **Rate Limit Category:** `sellers`
- **Parameters:** None

- **Response:**
```json
{
  "account": {
    "businessType": "PRIVATE_LIMITED",
    "sellingPlan": "PROFESSIONAL",
    "accountStatus": "ACTIVE"
  }
}
```

---

## Architecture

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `sellers` | 0.016 | 15 |

### Use Cases
- Account setup: discover which marketplaces the seller is registered in
- Multi-marketplace operations: determine active participations before querying marketplace-specific data
- Account health: check selling plan and account status

---

## Next Steps

- Phase 18: A+ Content Management
