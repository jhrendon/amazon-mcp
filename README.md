# Amazon MCP

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) servers for Amazon Seller Central and Amazon Ads API. Enables AI assistants (Claude, Cursor, Windsurf, etc.) to manage your Amazon account using natural language.

```
amazon-mcp/
├── amazon-seller-mcp   118 tools  -  Seller Central (SP-API)
├── amazon-ads-mcp      110 tools  -  Ads API (SP, SB, SD)
└── amazon-mcp-common              -  Shared library
```

## Table of Contents

- [What You Can Do](#what-you-can-do)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Connecting to AI Clients](#connecting-to-ai-clients)
- [amazon-seller-mcp - Tools](#amazon-seller-mcp---tools)
- [amazon-ads-mcp - Tools](#amazon-ads-mcp---tools)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## What You Can Do

**Seller Central (amazon-seller-mcp)**

- Query orders, FBA inventory, sales, and metrics
- Manage listings (create, edit, delete) and check listing restrictions
- Analyze competitive pricing and Buy Box (v0 and v2022-04-01)
- Get FBA reimbursements, storage fees, and return reports
- Create and manage inbound shipment plans to FBA (packing, placement, transportation)
- Manage Multi-Channel Fulfillment (MCF) orders and returns
- Generate invoices and download documents
- Access Brand Analytics reports (search terms, market basket, repeat purchases)
- Send review request to buyers
- Submit and manage product feeds (batch operations)
- Manage A+ Content documents and publish records
- Subscribe to notifications and manage delivery destinations
- Get product type definitions for listing attributes
- Check marketplace participations and seller account info

**Ads API (amazon-ads-mcp)**

- Manage Sponsored Products, Sponsored Brands, and Sponsored Display campaigns
- Create and download performance reports
- Optimize keywords, bids, and budgets (including negative keywords/targets)
- Calculate ACoS, TACoS, and ROAS
- Correlate ads data with Seller Central sales
- Manage SB stores, landing pages, and media uploads (requires Brand Registry)
- Get budget and bid recommendations for SP/SB/SD campaigns
- Manage advertising portfolios

## Prerequisites

- Node.js >= 18
- pnpm >= 9
- LWA (Login with Amazon) credentials — obtain them from **Seller Central → Developer** section (Apps & Credentials)
- For Seller Central: SP-API Refresh Token, Seller ID, Marketplace ID
- For Ads API: Refresh Token with `advertising::campaign_management` scope, Profile ID

## Installation

```bash
git clone https://github.com/jhrendon/amazon-mcp.git
cd amazon-mcp
pnpm install
cp .env.example .env
```

## Configuration

Edit `.env` with your credentials. You only need to configure the package you plan to use.

### Seller Central (amazon-seller-mcp)

```bash
LWA_CLIENT_ID=amzn1.application-oa2-client.xxxxxxxxxxxx
LWA_CLIENT_SECRET=amzn1.oa2-cs.xxxxxxxxxxxxxxxxxxxxxxxx
SELLER_REFRESH_TOKEN=Atzr|IwEBIxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SELLER_ID=Axxxxxxxxxxxxxxx
MARKETPLACE_ID=ATVPDKIKX0DER
```

| Variable | Description |
|---|---|
| `LWA_CLIENT_ID` | Your LWA application Client ID |
| `LWA_CLIENT_SECRET` | Your LWA application Client Secret |
| `SELLER_REFRESH_TOKEN` | Refresh Token obtained from SP-API with seller permissions |
| `SELLER_ID` | Your Merchant ID (Seller ID) on Amazon |
| `MARKETPLACE_ID` | Primary marketplace ID (e.g. `ATVPDKIKX0DER` for US, `A1AM78C64UM0Y8` for MX) |

### Ads API (amazon-ads-mcp)

```bash
LWA_CLIENT_ID=amzn1.application-oa2-client.xxxxxxxxxxxx
LWA_CLIENT_SECRET=amzn1.oa2-cs.xxxxxxxxxxxxxxxxxxxxxxxx
ADS_REFRESH_TOKEN=Atzr|IwEBIxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADS_PROFILE_ID=1234567890
ADS_API_REGION=na
```

| Variable | Description |
|---|---|
| `ADS_REFRESH_TOKEN` | Refresh Token with `advertising::campaign_management` scope |
| `ADS_PROFILE_ID` | Your advertising profile ID |
| `ADS_API_REGION` | API region: `na`, `eu`, or `fe` |

### Build

```bash
pnpm build
```

## Connecting to AI Clients

Each MCP server communicates via **stdio**. Configure your AI client to run the corresponding server.

### Claude Desktop

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "amazon-seller": {
      "command": "node",
      "args": ["/path/to/amazon-mcp/packages/amazon-seller-mcp/dist/index.js"],
      "env": {
        "LWA_CLIENT_ID": "amzn1.application-oa2-client.xxxxxxxxxxxx",
        "LWA_CLIENT_SECRET": "amzn1.oa2-cs.xxxxxxxxxxxxxxxxxxxxxxxx",
        "SELLER_REFRESH_TOKEN": "Atzr|IwEBIxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "SELLER_ID": "Axxxxxxxxxxxxxxx",
        "MARKETPLACE_ID": "ATVPDKIKX0DER"
      }
    },
    "amazon-ads": {
      "command": "node",
      "args": ["/path/to/amazon-mcp/packages/amazon-ads-mcp/dist/index.js"],
      "env": {
        "LWA_CLIENT_ID": "amzn1.application-oa2-client.xxxxxxxxxxxx",
        "LWA_CLIENT_SECRET": "amzn1.oa2-cs.xxxxxxxxxxxxxxxxxxxxxxxx",
        "ADS_REFRESH_TOKEN": "Atzr|IwEBIxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "ADS_PROFILE_ID": "1234567890",
        "ADS_API_REGION": "na"
      }
    }
  }
}
```

### Cursor / Windsurf

Add to `.cursor/mcp.json` or your editor's MCP configuration:

```json
{
  "mcpServers": {
    "amazon-seller": {
      "command": "node",
      "args": ["/path/to/amazon-mcp/packages/amazon-seller-mcp/dist/index.js"]
    }
  }
}
```

Environment variables are inherited from `.env` in the project root if running from there.

### Development with tsx

For development without building:

```json
{
  "mcpServers": {
    "amazon-seller": {
      "command": "npx",
      "args": ["tsx", "/path/to/amazon-mcp/packages/amazon-seller-mcp/src/index.ts"]
    }
  }
}
```

## amazon-seller-mcp - Tools

118 tools organized by category.

### Orders (3)

| Tool | Description |
|---|---|
| `get_orders` | List orders with filters by date, status, and fulfillment channel |
| `get_order_details` | Full order detail (address, buyer, status). Requires RDT for PII |
| `get_order_items` | Order line items (ASIN, SKU, quantity, price, taxes) |

### FBA Inventory (2)

| Tool | Description |
|---|---|
| `get_inventory_summary` | FBA inventory summary: available, reserved, inbound, unfulfillable |
| `get_fba_inventory_details` | Deep breakdown: reservation reasons, damage types, researching quantities |

### Sales (2)

| Tool | Description |
|---|---|
| `get_sales_metrics` | Aggregated sales metrics (Sales API). Best for 7+ day ranges. 24-48h delay |
| `get_sales_summary` | Real-time sales summary from orders data. Best for today/yesterday |

### Catalog (2)

| Tool | Description |
|---|---|
| `get_catalog_item` | Product info by ASIN: title, brand, BSR, images, bullet points |
| `search_catalog` | Search catalog by keywords or identifiers (ASIN, SKU, UPC, EAN) |

### Listings (5)

| Tool | Description |
|---|---|
| `get_listing` | Full listing document by SKU: attributes, offers, issues |
| `search_listings` | Search seller listings with filters (status, SKU, product type) |
| `put_listing` | Create or fully replace a listing (destructive) |
| `patch_listing` | Partial update (JSON Merge Patch). Only changes provided fields |
| `delete_listing` | Permanent and irreversible listing deletion |

### Pricing & Competition (2)

| Tool | Description |
|---|---|
| `get_competitive_summary` | Competitive pricing: featured offer, lowest price, Buy Box, offer count (up to 20 ASINs) |
| `get_featured_offer_expected_price_batch` | Expected Buy Box winning price (FOEP) for up to 40 SKUs |

### Fees & Costs (5)

| Tool | Description |
|---|---|
| `get_fees_estimate_for_asin` | Real-time FBA fee estimates by ASIN (up to 20). For repricing |
| `get_fees_estimate_for_sku` | Real-time FBA fee estimate by SKU with shipping speed |
| `get_fba_fee_estimates` | Point-in-time FBA fees by SKU: referral, fulfillment, pick-pack |
| `get_storage_fees` | Monthly FBA storage fees by SKU: cost, volume, utilization |
| `get_longterm_storage_fees` | Long-term storage fees (365+ days) by 6-month and 12-month tiers |

### Finances (3)

| Tool | Description |
|---|---|
| `get_financial_events` | Financial events by date range: sales, refunds, fees, adjustments |
| `get_financial_event_groups` | Event groups (disbursements): transfers, balances, settlement periods |
| `get_order_financial_events` | Financial breakdown for an order: sale, fees, taxes, shipping, adjustments |

### Invoices (3)

| Tool | Description |
|---|---|
| `get_invoices` | List shipment invoices in a date range with status filters |
| `get_invoice_document` | Download invoice PDF (base64 if < 1MB, URL if >= 1MB) |
| `create_invoice` | Generate invoice for an FBA shipment with line items. Permanent, has tax implications |

### Settlements (1)

| Tool | Description |
|---|---|
| `get_settlement_report` | Amazon-generated settlement reports: sales, refunds, fees, net per transaction |

### FBA Inbound (34)

| Tool | Description |
|---|---|
| `list_inbound_plans` | List FBA inbound plans with pagination and filters |
| `get_inbound_plan` | Detail of a specific inbound plan |
| `create_inbound_plan` | Create inbound plan with origin address and items |
| `list_inbound_plan_shipments` | List shipments within an inbound plan |
| `get_inbound_shipment` | Detail of a specific inbound shipment |
| `list_inbound_plan_items` | List items in an inbound plan |
| `list_inbound_plan_packing_options` | List packing options for an inbound plan |
| `generate_inbound_plan_packing_options` | Generate packing options for an inbound plan |
| `confirm_inbound_plan_packing_option` | Confirm a packing option for an inbound plan |
| `set_inbound_plan_packing_information` | Set packing information for an inbound plan |
| `list_inbound_plan_placement_options` | List placement options for an inbound plan |
| `generate_inbound_plan_placement_options` | Generate placement options for an inbound plan |
| `confirm_inbound_plan_placement_option` | Confirm a placement option for an inbound plan |
| `get_inbound_plan_transportation_options` | Get transportation options for an inbound plan |
| `generate_inbound_plan_transportation_options` | Generate transportation options for an inbound plan |
| `confirm_inbound_plan_transportation_options` | Confirm transportation options for an inbound plan |
| `get_shipment` | Get shipment details |
| `list_shipment_items` | List items in a shipment |
| `get_item_compliance` | Get item compliance details |
| `list_item_compliance` | List item compliance for an inbound plan |
| `create_market_item_labels` | Create market item labels for an inbound plan |
| `get_inbound_operation_status` | Get status of an async inbound operation |
| `cancel_inbound_operation` | Cancel an async inbound operation |
| `list_delivery_window_options` | List delivery window options for a shipment |
| `confirm_delivery_window_options` | Confirm delivery window options for a shipment |
| `generate_delivery_window_options` | Generate delivery window options for a shipment |
| `get_inbound_plan_box_contents` | Get box contents for an inbound plan |
| `update_inbound_plan_box_contents` | Update box contents for an inbound plan |
| `get_shipment_box_contents` | Get box contents for a shipment |
| `update_shipment_box_contents` | Update box contents for a shipment |
| `list_transportation_tracking_details` | List transportation tracking details |
| `generate_transportation_tracking_details` | Generate transportation tracking details |
| `cancel_inbound_plan` | Cancel an inbound plan |
| `cancel_shipment` | Cancel a shipment within an inbound plan |

### Merchant Fulfillment (4)

| Tool | Description |
|---|---|
| `get_eligible_shipping_services` | Available shipping services for an MFN order with rates and delivery times |
| `create_shipment` | Create MFN shipment (purchase label) with selected service |
| `get_shipment` | MFN shipment detail: tracking and label info |
| `cancel_shipment` | Cancel MFN shipment before label is printed |

### Feedback & Reviews (4)

| Tool | Description |
|---|---|
| `get_feedback_insights_for_asin` | Feedback insights by ASIN: rating distribution and themes. Requires Brand Registry |
| `get_feedback_insights_for_browse_node` | Feedback insights by category. Requires Brand Registry |
| `get_solicitation_actions_for_order` | Available solicitation actions for an order (e.g. review request) |
| `request_product_review` | Request a review from the buyer of a delivered order |

### FBA Reports (4)

| Tool | Description |
|---|---|
| `get_fba_reimbursements` | FBA reimbursements for lost, damaged, or returned inventory |
| `get_fba_customer_returns` | FBA customer returns: reasons, quantities, affected SKUs |
| `get_fba_inventory_planning` | Inventory planning: days of supply, recommended replenishments |
| `get_inventory_ledger` / `get_inventory_ledger_detail` | Inventory movements: receipts, shipments, returns, adjustments |

### Analytics Reports (3)

| Tool | Description |
|---|---|
| `get_sales_traffic_report` | Sessions, page views, conversion rate, Buy Box %, sales by ASIN |
| `get_search_terms_report` | Brand Analytics: top search terms, frequency, click/conversion share. Requires Brand Registry |
| `get_all_orders_report` | Flat-file report of all orders: IDs, SKUs, quantities, prices, shipping |

### Brand Analytics (2)

| Tool | Description |
|---|---|
| `get_market_basket_report` | Products frequently purchased together. Requires Brand Registry |
| `get_repeat_purchase_report` | Loyalty metrics: unique vs repeat customers by search term. Requires Brand Registry |

### Data Kiosk (3)

| Tool | Description |
|---|---|
| `create_data_kiosk_query` | Create a Data Kiosk query with a GraphQL document |
| `get_data_kiosk_query` | Get status and result of a Data Kiosk query |
| `list_data_kiosk_queries` | List Data Kiosk queries with pagination and filters |

### Tokens (1)

| Tool | Description |
|---|---|
| `create_restricted_data_token` | Create RDT to access PII (shipping address, buyer info) |

### Feeds (6)

| Tool | Description |
|---|---|
| `get_feeds` | List feeds with filters by feed type, processing status, and date range |
| `get_feed` | Get details of a specific feed by ID |
| `create_feed` | Create a new feed for batch operations (listings, inventory, prices) |
| `cancel_feed` | Cancel a feed that has not yet started processing |
| `create_feed_document` | Create a feed document and get upload URL |
| `get_feed_document` | Get feed document download URL and result |

### Fulfillment Outbound - MCF (12)

| Tool | Description |
|---|---|
| `get_fulfillment_preview` | Get fulfillment preview for Multi-Channel Fulfillment orders |
| `list_all_fulfillment_orders` | List all MCF fulfillment orders |
| `get_fulfillment_order` | Get details of a specific MCF fulfillment order |
| `create_fulfillment_order` | Create a new MCF fulfillment order |
| `update_fulfillment_order` | Update an existing MCF fulfillment order |
| `cancel_fulfillment_order` | Cancel an MCF fulfillment order |
| `get_package_tracking_details` | Get package tracking details for MCF shipments |
| `list_return_reasons` | List return reasons for MCF returns |
| `create_fulfillment_return` | Create a return for an MCF fulfillment order |
| `list_fulfillment_returns` | List returns for MCF fulfillment orders |
| `get_fulfillment_shipment` | Get details of a specific MCF shipment |
| `get_features` | Get available MCF features and eligibility |

### Notifications (8)

| Tool | Description |
|---|---|
| `get_subscriptions` | List all notification subscriptions |
| `get_subscription` | Get details of a specific notification subscription |
| `create_subscription` | Create a new notification subscription |
| `update_subscription` | Update an existing notification subscription |
| `delete_subscription` | Delete a notification subscription |
| `get_destinations` | List all notification destinations |
| `create_destination` | Create a new notification destination (SQS, EventBridge) |
| `delete_destination` | Delete a notification destination |

### Product Pricing v0 (6)

| Tool | Description |
|---|---|
| `get_pricing` | Get pricing information for ASINs or SKUs |
| `get_competitive_pricing` | Get competitive pricing for ASINs or SKUs |
| `get_listing_offers` | Get offers for a seller's listing by SKU |
| `get_item_offers` | Get offers for an item by ASIN |
| `get_item_offers_batch` | Batch get offers for multiple items by ASIN |
| `get_listing_offers_batch` | Batch get offers for multiple listings by SKU |

### Product Type Definitions (2)

| Tool | Description |
|---|---|
| `search_product_type_definitions` | Search product type definitions by keywords |
| `get_product_type_definition` | Get full definition for a product type |

### Listings Restrictions (1)

| Tool | Description |
|---|---|
| `get_listings_restrictions` | Check listing restrictions for an ASIN |

### Sellers (2)

| Tool | Description |
|---|---|
| `get_marketplace_participations` | List marketplace participations for the seller |
| `get_account` | Get seller account information |

### A+ Content (10)

| Tool | Description |
|---|---|
| `search_content_documents` | Search A+ content documents |
| `create_content_document` | Create a new A+ content document |
| `get_content_document` | Get details of an A+ content document |
| `update_content_document` | Update an existing A+ content document |
| `list_content_document_asin_relations` | List ASINs associated with an A+ content document |
| `post_content_document_asin_relations` | Update ASIN relations for an A+ content document |
| `validate_content_document_asin_relations` | Validate ASIN relations for an A+ content document |
| `search_content_publish_records` | Search publish records for A+ content |
| `post_content_document_approval_submission` | Submit A+ content document for approval |
| `post_content_document_suspend_submission` | Suspend a published A+ content document |

## amazon-ads-mcp - Tools

110 tools for advertising management. See the [full documentation](packages/amazon-ads-mcp/README.md).

Summary by category:

| Category | Tools | Description |
|---|---|---|
| Profiles | 2 | List and get advertising profiles |
| Sponsored Products | 10 | Campaigns, ad groups, keywords, targets, product ads |
| Sponsored Brands | 6 | Campaigns, ad groups, keywords (requires Brand Registry) |
| Sponsored Display | 6 | Campaigns, ad groups, targets |
| Reports | 12 | Create, check status, download and read reports (4 per family) |
| Writes | 18 | Update campaigns, keywords, bids (SP: 7, SB: 7, SD: 4) |
| Optimization | 5 | Keyword suggestions, performance analysis, negative keywords, ACoS |
| Cross-MCP | 3 | Ads/sales correlation, TACoS, organic vs ad sales |
| Negative Keywords/Targets | 30 | Read and write negative keywords/targets for SP/SB/SD |
| SB Creative/Stores/Video | 9 | Stores, landing pages, media uploads (requires Brand Registry) |
| Budget/Bid Recommendations | 11 | Budget and bid recommendations for SP/SB/SD campaigns |
| Portfolios | 5 | List, get, create, and update advertising portfolios |

## amazon-mcp-common

Shared library used by both MCP servers:

| Module | Description |
|---|---|
| `TokenManager` | LWA OAuth 2.0 with caching and auto-refresh |
| `AmazonApiClient` | HTTP client with `Authorization: Bearer` and rate limiting |
| `RateLimiter` | Token bucket rate limiting per endpoint category |
| `ReportPoller` | Async report polling with automatic decompression |
| `CSVParser` | Parse tab and comma-delimited reports |
| `ConfigLoader` | Zod-based configuration validation |

## Development

```bash
# Install dependencies
pnpm install

# Type check
pnpm typecheck

# Lint
pnpm lint

# Tests
pnpm test

# Build all packages
pnpm build

# Clean artifacts
pnpm clean
```

### Project Structure

```
amazon-mcp/
├── packages/
│   ├── amazon-mcp-common/        # Shared library
│   │   └── src/
│   │       ├── auth/             # Token management
│   │       ├── client/           # HTTP client and rate limiter
│   │       ├── config/           # Zod-based configuration
│   │       ├── mcp/              # MCP utilities
│   │       └── utils/            # CSV parser, report poller
│   │
│   ├── amazon-seller-mcp/        # Seller Central MCP (118 tools)
│   │   └── src/
│   │       ├── auth/             # Credential validation and RDT
│   │       ├── client/           # SP-API client and rate limiter
│   │       ├── config/           # Package-specific configuration
│   │       └── tools/            # SP-API tools
│   │           ├── orders.ts
│   │           ├── inventory.ts
│   │           ├── sales.ts
│   │           ├── catalog.ts
│   │           ├── listings.ts
│   │           ├── pricing.ts
│   │           ├── pricing-v0.ts
│   │           ├── finances.ts
│   │           ├── invoices.ts
│   │           ├── fees.ts
│   │           ├── feedback.ts
│   │           ├── solicitations.ts
│   │           ├── fba-inbound.ts
│   │           ├── fulfillment-outbound.ts
│   │           ├── merchant-fulfillment.ts
│   │           ├── feeds.ts
│   │           ├── notifications.ts
│   │           ├── product-type-definitions.ts
│   │           ├── listings-restrictions.ts
│   │           ├── sellers.ts
│   │           ├── aplus-content.ts
│   │           ├── data-kiosk.ts
│   │           ├── tokens.ts
│   │           └── reports/      # FBA reports, settlements, analytics
│   │
│   └── amazon-ads-mcp/           # Ads API MCP (110 tools)
│       └── src/tools/
│           ├── sp/               # Sponsored Products
│           ├── sb/               # Sponsored Brands
│           ├── sd/               # Sponsored Display
│           ├── reports/          # Async reports
│           ├── writes/           # Write operations
│           ├── optimization/     # Analysis and optimization
│           ├── negative.ts       # Negative keywords/targets
│           ├── sb-creative.ts    # SB stores, landing pages, media
│           ├── recommendations.ts # Budget/bid recommendations
│           ├── portfolios.ts     # Portfolio management
│           └── cross-mcp/        # Integration with seller-mcp
│
├── docs/
│   ├── openspec/                 # Tool specifications
│   └── adr/                      # Architecture decisions
└── scripts/                      # Versioning and publishing scripts
```

### Run in Development Mode

```bash
# Seller Central
cd packages/amazon-seller-mcp && pnpm dev

# Ads API
cd packages/amazon-ads-mcp && pnpm dev
```

### Versioning and Publishing

```bash
# Update version
node scripts/version.js 1.1.0

# Publish to npm (dry run)
node scripts/publish.js --dry-run

# Publish to npm
node scripts/publish.js
```

CI/CD with GitHub Actions runs on `v*` tag push: tests, build, npm publish, and GitHub Release creation.

## Troubleshooting

### Authentication Error

```
Authentication failed. Please check your LWA credentials.
```

1. Verify `LWA_CLIENT_ID` and `LWA_CLIENT_SECRET` are correct
2. Confirm the refresh token has not expired (regenerate if needed)
3. For Seller Central: token must have SP-API scopes
4. For Ads API: token must have `advertising::campaign_management` scope

### Rate Limiting

```
Rate limited by Amazon API. Please try again later.
```

The client automatically retries with exponential backoff. If persistent, reduce call frequency.

### Brand Registry Required

```
Sponsored Brands API requires Brand Registry.
```

Sponsored Brands and some Brand Analytics tools require active Brand Registry in Seller Central.

### Server Won't Start

1. Verify environment variables are set
2. Run `pnpm build` before using `node dist/index.js`
3. In development use `pnpm dev` (tsx) to skip building
4. Check stderr output: the server validates credentials against Amazon before accepting connections

### Common Marketplace IDs

| Country | Marketplace ID |
|---|---|
| United States | `ATVPDKIKX0DER` |
| Mexico | `A1AM78C64UM0Y8` |
| Canada | `A2EUQ1WTGCTBG2` |
| Spain | `A1RKKUPIHCS9HS` |
| United Kingdom | `A1F83G8C2ARO7P` |
| Germany | `A1PA6795UKMFR9` |
| France | `A13V1IB3VIYZZH` |
| Italy | `APJ6JRA9NG5V4` |
| Japan | `A1VC38T7YXB528` |

## License

MIT

## Links

- [Amazon Selling Partner API](https://developer-docs.amazon.com/sp-api/)
- [Amazon Ads API](https://advertising.amazon.com/API/docs)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Deployment Guide](./DEPLOYMENT.md)
- [Architecture Decisions](./docs/adr/)
