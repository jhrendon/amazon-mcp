# OpenSpec: Amazon Ads MCP - Phase 7 (Optimization)

## Summary

Implementation of optimization and analysis tools to improve advertising campaign performance on Amazon.

## Implemented Tools

### Keyword Suggestions (2 tools)

#### sp_get_keyword_suggestions
- **Description**: Gets keyword suggestions for a specific ASIN in SP
- **Endpoint**: `POST /v2/sp/keywords/bidding/suggestions`
- **Parameters**:
  - `asin` (string, required): Product ASIN
  - `campaignId` (number, optional): Campaign ID to filter suggestions
- **Response**: List of suggested keywords with recommended bid
- **Response example**:
```json
{
  "suggestedKeywords": [
    {
      "keyword": "wireless headphones",
      "matchType": "BROAD",
      "bid": 1.25
    }
  ]
}
```

#### sb_get_keyword_suggestions
- **Description**: Gets keyword suggestions for SB (requires Brand Registry)
- **Endpoint**: `POST /v2/hs/keywords/bidding/suggestions`
- **Parameters**: Same as SP
- **Note**: Returns 403 error if Brand Registry is not active

### Campaign Analysis (1 tool)

#### analyze_campaign_performance
- **Description**: Analyzes campaign performance and generates recommendations
- **Endpoints**: 
  - SP: `POST /v2/sp/campaigns/report`
  - SB: `POST /v2/hs/campaigns/report`
  - SD: `POST /sd/campaigns/report`
- **Parameters**:
  - `campaignType` (enum, required): sp | sb | sd
  - `startDate` (string, required): YYYY-MM-DD
  - `endDate` (string, required): YYYY-MM-DD
  - `segment` (enum, optional, default: campaign): campaign | adGroup | keyword
- **Process**:
  1. Creates async report
  2. Waits for completion (polling with ReportPoller)
  3. Downloads and decompresses data
  4. Analyzes metrics: impressions, clicks, cost, sales, ACoS, ROAS
  5. Identifies top/bottom performers
  6. Generates automatic recommendations
- **Response**:
```json
{
  "reportId": "string",
  "period": { "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" },
  "summary": {
    "totalCampaigns": 10,
    "totalSales": 5000.00,
    "totalCost": 1000.00,
    "overallAcos": "20.00%"
  },
  "topPerformers": [...],
  "bottomPerformers": [...],
  "recommendations": [
    "Overall ACoS is above 50%. Consider reducing bids or pausing underperforming campaigns.",
    "2 campaign(s) have spend but no sales. Consider pausing them.",
    "3 campaign(s) have ACoS below 20%. Consider increasing bids to scale."
  ]
}
```

### Negative Keywords (1 tool)

#### identify_negative_keywords
- **Description**: Identifies search terms with high spend but no conversions
- **Endpoints**:
  - SP: `POST /v2/sp/searchTerms/report`
  - SB: `POST /v2/hs/searchTerms/report`
- **Parameters**:
  - `campaignType` (enum, required): sp | sb
  - `startDate` (string, required): YYYY-MM-DD
  - `endDate` (string, required): YYYY-MM-DD
  - `minSpend` (number, optional, default: 5): Minimum spend to consider
  - `maxOrders` (number, optional, default: 0): Maximum allowed orders
- **Process**:
  1. Generates search terms report
  2. Filters by configurable thresholds
  3. Sorts by cost descending
  4. Returns top 50 candidates
- **Response**:
```json
{
  "reportId": "string",
  "period": { "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" },
  "summary": {
    "totalSearchTerms": 500,
    "negativeKeywordCandidates": 25,
    "totalWastedSpend": "150.00"
  },
  "candidates": [
    {
      "searchTerm": "cheap headphones",
      "campaignId": 123,
      "campaignName": "SP Campaign 1",
      "adGroupId": 456,
      "adGroupName": "Ad Group 1",
      "keywordText": "wireless headphones",
      "matchType": "BROAD",
      "cost": "25.00",
      "sales": "0.00",
      "orders": 0,
      "clicks": 15,
      "impressions": 500
    }
  ],
  "recommendations": [
    "Found 25 search terms with spend >= $5 and orders <= 0.",
    "Total wasted spend: $150.00",
    "Consider adding these as negative keywords to reduce wasted ad spend.",
    "Review each term carefully before adding - some may be relevant but just not converting yet."
  ]
}
```

### ACoS Breakdown (1 tool)

#### calculate_acos_breakdown
- **Description**: Calculates ACoS breakdown by campaign, ad group, or keyword
- **Endpoints**:
  - Campaigns: `/v2/sp/campaigns/report`, `/v2/hs/campaigns/report`, `/sd/campaigns/report`
  - Ad Groups: `/v2/sp/adGroups/report`, `/v2/hs/adGroups/report`, `/sd/adGroups/report`
  - Keywords: `/v2/sp/keywords/report`, `/v2/hs/keywords/report`, `/sd/targets/report`
- **Parameters**:
  - `campaignType` (enum, required): sp | sb | sd
  - `startDate` (string, required): YYYY-MM-DD
  - `endDate` (string, required): YYYY-MM-DD
  - `segment` (enum, optional, default: campaign): campaign | adGroup | keyword
  - `campaignIdFilter` (array, optional): Filter by campaign IDs
- **Calculated metrics**:
  - impressions, clicks, CTR, CPC
  - cost, sales, orders
  - ACoS (Advertising Cost of Sales)
  - ROAS (Return on Ad Spend)
- **Response**:
```json
{
  "reportId": "string",
  "period": { "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" },
  "segment": "campaign",
  "summary": {
    "totalSegments": 10,
    "totalSales": "$5000.00",
    "totalCost": "$1000.00",
    "overallAcos": "20.00%",
    "profitableSegments": 7,
    "unprofitableSegments": 3
  },
  "breakdown": [
    {
      "id": 123,
      "name": "Campaign 1",
      "impressions": 10000,
      "clicks": 500,
      "ctr": "5.00%",
      "cpc": "$2.00",
      "cost": "$1000.00",
      "sales": "$5000.00",
      "orders": 50,
      "acos": "20.00%",
      "roas": "5.00"
    }
  ],
  "insights": [
    "7 campaign(s) have ACoS < 30% (profitable)",
    "3 campaign(s) have ACoS > 50% or no sales (unprofitable)",
    "Overall ACoS: 20.00%",
    "Consider optimizing or pausing 3 unprofitable campaign(s)"
  ]
}
```

## Architecture

### Report Generation
- All analysis tools use the async report pattern
- `ReportPoller` from `amazon-mcp-common` handles polling and download
- Automatic decompression of gzipped files
- JSON parsing with type validation

### Automatic Recommendations
- Based on configurable thresholds:
  - ACoS > 50%: Consider reducing bids or pausing
  - ACoS < 20%: Consider increasing bids to scale
  - Spend without sales: Candidate for pausing or negative keyword
- Contextual insights based on aggregated data

### Rate Limiting
- `suggestions`: 1 req/s, burst 5
- `reports`: 1 req/s, burst 5 (shared with Phase 5)

## Testing

Unit tests cover:
- Correct endpoint calls
- Report data processing
- Metrics calculation (ACoS, ROAS, CTR, CPC)
- Recommendation generation

## Next Steps

- Phase 8: Cross-MCP Integration (correlation with Seller Central)