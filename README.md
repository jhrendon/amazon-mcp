# Amazon MCP

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) servers for Amazon Seller Central and Amazon Ads API. Enables AI assistants (Claude, Cursor, Windsurf, etc.) to manage your Amazon account using natural language.

```
amazon-mcp/
├── amazon-seller-mcp   43 tools  -  Seller Central (SP-API)
├── amazon-ads-mcp      62 tools  -  Ads API (SP, SB, SD)
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
- Manage listings (create, edit, delete)
- Analyze competitive pricing and Buy Box
- Get FBA reimbursements, storage fees, and return reports
- Create inbound shipment plans to FBA
- Generate invoices and download documents
- Access Brand Analytics reports (search terms, market basket, repeat purchases)
- Send review request to buyers

**Ads API (amazon-ads-mcp)**

- Manage Sponsored Products, Sponsored Brands, and Sponsored Display campaigns
- Create and download performance reports
- Optimize keywords, bids, and budgets
- Calculate ACoS, TACoS, and ROAS
- Correlate ads data with Seller Central sales

## Prerequisites

- Node.js >= 18
- pnpm >= 9
- LWA (Login with Amazon) credentials - [get them here](https://developer.amazon.com/)
- For Seller Central: SP-API Refresh Token, Seller ID, Marketplace ID
- For Ads API: Refresh Token with `advertising::campaign_management` scope, Profile ID

## Installation

```bash
git clone https://github.com/your-org/amazon-mcp.git
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

43 tools organized by category.

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

### FBA Inbound (5)

| Tool | Description |
|---|---|
| `list_inbound_plans` | List FBA inbound plans with pagination and filters |
| `get_inbound_plan` | Detail of a specific inbound plan |
| `create_inbound_plan` | Create inbound plan with origin address and items |
| `list_inbound_plan_shipments` | List shipments within an inbound plan |
| `get_inbound_shipment` | Detail of a specific inbound shipment |

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

## amazon-ads-mcp - Tools

62 tools for advertising management. See the [full documentation](packages/amazon-ads-mcp/README.md).

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
│   ├── amazon-seller-mcp/        # Seller Central MCP (43 tools)
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
│   │           ├── finances.ts
│   │           ├── invoices.ts
│   │           ├── fees.ts
│   │           ├── feedback.ts
│   │           ├── solicitations.ts
│   │           ├── fba-inbound.ts
│   │           ├── merchant-fulfillment.ts
│   │           ├── data-kiosk.ts
│   │           ├── tokens.ts
│   │           └── reports/      # FBA reports, settlements, analytics
│   │
│   └── amazon-ads-mcp/           # Ads API MCP (62 tools)
│       └── src/tools/
│           ├── sp/               # Sponsored Products
│           ├── sb/               # Sponsored Brands
│           ├── sd/               # Sponsored Display
│           ├── reports/          # Async reports
│           ├── writes/           # Write operations
│           ├── optimization/     # Analysis and optimization
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
