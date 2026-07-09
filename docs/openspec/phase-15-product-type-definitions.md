# Phase 15: Product Type Definitions

**Status:** Planned
**Date:** 2026-07-09

Tools to retrieve Amazon product type definitions and attribute requirements. Essential for creating correct listings.

---

## 1. Product Type Definitions (2 tools)

### search_product_type_definitions

- **Description:** Search available product type definitions. Returns product types with display names and marketplace availability.
- **Endpoint:** `GET /definitions/2020-09-01/productTypes`
- **Rate Limit Category:** `productTypeDefinitions`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `keywords` | `string[]` | No | Search keywords |
| `itemName` | `string` | No | Item name to find recommendations |
| `locale` | `string` | No | Locale (e.g. `en_US`) |
| `searchLocale` | `string[]` | No | Search locales |
| `marketplaceIds` | `string[]` | **Yes** | Marketplace IDs |

- **Response:**
```json
{
  "productTypes": [
    {
      "name": "LUGGAGE",
      "displayName": "Luggage",
      "marketplaceIds": ["ATVPDKIKX0DER"]
    },
    {
      "name": "SHIRT",
      "displayName": "Shirt",
      "marketplaceIds": ["ATVPDKIKX0DER"]
    }
  ],
  "productTypeVersion": "2.0.0"
}
```

---

### get_product_type_definition

- **Description:** Get the full product type definition including JSON Schema for attributes, requirements, and validations.
- **Endpoint:** `GET /definitions/2020-09-01/productTypes/{productType}`
- **Rate Limit Category:** `productTypeDefinitions`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `productType` | `string` | **Yes** | Product type name (e.g. `LUGGAGE`, `SHIRT`) |
| `sellerId` | `string` | No | Seller ID |
| `marketplaceIds` | `string[]` | **Yes** | Marketplace IDs |
| `locale` | `string` | No | Locale |
| `requirements` | `enum` | No | `LISTING`, `LISTING_PRODUCT_ONLY`, `LISTING_OFFER_ONLY`, `BROWSE_TREE_GUIDE` |
| `requirementsEnforced` | `enum` | No | `ENFORCED`, `NOT_ENFORCED` |
| `useCase` | `enum` | No | `CREATE`, `UPDATE`, `REPLACE` |

- **Response:**
```json
{
  "productType": "LUGGAGE",
  "productTypeVersion": "2.0.0",
  "propertyGroups": {
    "main": {
      "title": "Main",
      "properties": ["item_name", "brand", "bullet_point"]
    }
  },
  "schema": {
    "type": "object",
    "properties": {
      "item_name": {
        "type": "string",
        "title": "Item Name",
        "description": "The title of the product"
      },
      "brand": {
        "type": "string",
        "title": "Brand"
      }
    },
    "required": ["item_name", "brand"]
  }
}
```

---

## Architecture

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `productTypeDefinitions` | 5 | 10 |

### Use Cases
- Before creating a listing: get the schema to know which attributes are required
- Before updating a listing: understand which attributes can be modified
- Browse tree guide: get category-specific browse node information

---

## Next Steps

- Phase 16: Listings Restrictions
