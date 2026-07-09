# amazon-ads-mcp

MCP server for Amazon Ads API (Sponsored Products, Sponsored Brands, Sponsored Display).

## Status

**Phase 8 Complete** - Cross-MCP integration with amazon-seller-mcp implemented.

## Features

- LWA OAuth 2.0 authentication with automatic token refresh
- Automatic rate limiting per endpoint category
- Retry logic with exponential backoff for retryable errors
- Support for all three ad families: SP, SB, SD
- 24 tools for reading campaigns, ad groups, keywords, targets, and product ads
- 12 tools for async reports (create, status, download, read)
- 18 tools for writing (update campaigns, keywords, bids)
- 5 tools for optimization and analysis
- 3 tools for cross-MCP integration with amazon-seller-mcp

## Configuration

Set the following environment variables:

```bash
# LWA Credentials (shared with amazon-seller-mcp)
LWA_CLIENT_ID=amzn1.application-oa2-client.xxxxx
LWA_CLIENT_SECRET=amzn1.oa2-cs.xxxxx

# Ads API Credentials
ADS_REFRESH_TOKEN=Atzr|xxxxx  # Must have advertising::campaign_management scope
ADS_PROFILE_ID=1234567890      # Your advertising profile ID
ADS_API_REGION=na              # na, eu, or fe
ADS_API_ENDPOINT=https://advertising-api.amazon.com  # Optional override
```

## Tools

### Profiles (2 tools)
- `list_profiles` - List all advertising profiles accessible with your credentials
- `get_profile` - Get details for a specific advertising profile by ID

### Sponsored Products (SP) - 10 tools
- `sp_list_campaigns` - List all SP campaigns
- `sp_get_campaign` - Get details for a specific SP campaign
- `sp_list_ad_groups` - List all SP ad groups
- `sp_get_ad_group` - Get details for a specific SP ad group
- `sp_list_keywords` - List all SP keywords
- `sp_get_keyword` - Get details for a specific SP keyword
- `sp_list_targets` - List all SP targets
- `sp_get_target` - Get details for a specific SP target
- `sp_list_product_ads` - List all SP product ads
- `sp_get_product_ad` - Get details for a specific SP product ad

### Sponsored Brands (SB) - 6 tools (Requires Brand Registry)
- `sb_list_campaigns` - List all SB campaigns
- `sb_get_campaign` - Get details for a specific SB campaign
- `sb_list_ad_groups` - List all SB ad groups
- `sb_get_ad_group` - Get details for a specific SB ad group
- `sb_list_keywords` - List all SB keywords
- `sb_get_keyword` - Get details for a specific SB keyword

### Sponsored Display (SD) - 6 tools
- `sd_list_campaigns` - List all SD campaigns
- `sd_get_campaign` - Get details for a specific SD campaign
- `sd_list_ad_groups` - List all SD ad groups
- `sd_get_ad_group` - Get details for a specific SD ad group
- `sd_list_targets` - List all SD targets
- `sd_get_target` - Get details for a specific SD target

### Reports - 12 tools (4 per family)

#### Sponsored Products Reports
- `sp_create_report` - Create a SP report (campaigns, ad groups, keywords, targets, product ads)
- `sp_get_report_status` - Check status of a SP report
- `sp_download_report` - Download a completed SP report
- `sp_read_report` - Create, wait for, and read a SP report in one operation

#### Sponsored Brands Reports (Requires Brand Registry)
- `sb_create_report` - Create a SB report (campaigns, ad groups, keywords)
- `sb_get_report_status` - Check status of a SB report
- `sb_download_report` - Download a completed SB report
- `sb_read_report` - Create, wait for, and read a SB report in one operation

#### Sponsored Display Reports
- `sd_create_report` - Create a SD report (campaigns, ad groups, targets)
- `sd_get_report_status` - Check status of a SD report
- `sd_download_report` - Download a completed SD report
- `sd_read_report` - Create, wait for, and read a SD report in one operation

### Writes - 18 tools (6 per family)

#### Sponsored Products Writes
- `sp_update_campaign` - Update a SP campaign (name, state, dailyBudget)
- `sp_pause_campaign` - Pause a SP campaign
- `sp_enable_campaign` - Enable a SP campaign
- `sp_update_ad_group` - Update a SP ad group
- `sp_update_keyword` - Update a SP keyword
- `sp_update_keyword_bid` - Update the bid for a SP keyword
- `sp_create_keyword` - Create a new SP keyword

#### Sponsored Brands Writes (Requires Brand Registry)
- `sb_update_campaign` - Update a SB campaign
- `sb_pause_campaign` - Pause a SB campaign
- `sb_enable_campaign` - Enable a SB campaign
- `sb_update_ad_group` - Update a SB ad group
- `sb_update_keyword` - Update a SB keyword
- `sb_update_keyword_bid` - Update the bid for a SB keyword
- `sb_create_keyword` - Create a new SB keyword

#### Sponsored Display Writes
- `sd_update_campaign` - Update a SD campaign
- `sd_pause_campaign` - Pause a SD campaign
- `sd_enable_campaign` - Enable a SD campaign
- `sd_update_ad_group` - Update a SD ad group

### Optimization - 5 tools
- `sp_get_keyword_suggestions` - Get keyword suggestions for a specific ASIN (SP)
- `sb_get_keyword_suggestions` - Get keyword suggestions for a specific ASIN (SB, requires Brand Registry)
- `analyze_campaign_performance` - Analyze campaign performance metrics
- `identify_negative_keywords` - Identify search terms with high spend but no conversions
- `calculate_acos_breakdown` - Calculate ACoS breakdown by campaign, ad group, or keyword

### Cross-MCP Integration - 3 tools
- `correlate_ads_with_sales` - Correlate Amazon Ads data with Seller Central sales data
- `calculate_tacos` - Calculate Total Advertising Cost of Sales (TACoS)
- `analyze_organic_vs_ad_sales` - Analyze the proportion of organic vs ad-attributed sales

## Usage

```bash
# Build
pnpm build

# Run
pnpm start

# Development
pnpm dev
```

## Architecture

Uses `amazon-mcp-common` for shared infrastructure:
- `TokenManager` - LWA OAuth 2.0 with `scope: advertising::campaign_management`
- `AmazonApiClient` - HTTP client with `Authorization: Bearer` header
- `RateLimiter` - Token bucket rate limiting per endpoint category
- `ReportPoller` - Async report polling with automatic decompression
- `makeToolResponse` - Standardized MCP tool responses

## Next Phases

- **Phase 9**: Testing, documentation, deployment
