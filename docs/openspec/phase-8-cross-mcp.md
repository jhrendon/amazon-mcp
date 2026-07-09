# OpenSpec: Amazon Ads MCP - Phase 8 (Cross-MCP Integration)

## Summary

Implementation of tools that correlate Amazon Ads data with Seller Central data to provide comprehensive analysis of advertising and organic performance.

## Implemented Tools

### 1. correlate_ads_with_sales

**Description**: Correlates Amazon Ads data with Seller Central sales by ASIN.

**Endpoint**: Does not use direct API, processes local report files.

**Parameters**:
- `adsReportPath` (string, required): Path to Ads API report file (gzipped JSON)
- `sellerReportPath` (string, required): Path to Seller Central report file (CSV or JSON)
- `dateRange` (object, optional): Date range filter
  - `startDate` (string): YYYY-MM-DD
  - `endDate` (string): YYYY-MM-DD

**Process**:
1. Reads and decompresses Ads API report (gzipped JSON)
2. Reads Seller Central report (CSV/JSON/JSON.gz)
3. Filters by date range if provided
4. Groups data by ASIN
5. Calculates metrics per ASIN:
   - Total Sales (from Seller Central)
   - Ad Attributed Sales (from Ads API)
   - Organic Sales (Total - Ad Attributed)
   - Ad Spend (from Ads API)
   - ACoS (Ad Spend / Ad Attributed Sales)
   - Organic Percentage (Organic Sales / Total Sales)
6. Sorts by total sales descending
7. Identifies ASINs with high ad dependency (<30% organic)
8. Identifies ASINs with high organic performance (>70% organic)

**Response**:
```json
{
  "period": { "startDate": "2024-01-01", "endDate": "2024-01-31" },
  "summary": {
    "totalAsins": 50,
    "totalSales": 10000.00,
    "totalAdAttributedSales": 6000.00,
    "totalOrganicSales": 4000.00,
    "totalAdSpend": 1200.00,
    "overallAcos": 20.00,
    "overallOrganicPercentage": 40.00
  },
  "highOrganicAsins": [
    {
      "asin": "B08N5WRWNW",
      "organicPercentage": 85.5,
      "totalSales": 2500.00
    }
  ],
  "highAdDependentAsins": [
    {
      "asin": "B07XJ8C8F5",
      "organicPercentage": 15.2,
      "totalSales": 1500.00,
      "acos": 35.50
    }
  ],
  "correlations": [
    {
      "asin": "B08N5WRWNW",
      "totalSales": 2500.00,
      "adAttributedSales": 362.50,
      "organicSales": 2137.50,
      "adSpend": 150.00,
      "acos": 41.38,
      "organicPercentage": 85.50
    }
  ],
  "insights": [
    "15 ASINs are primarily organic (>70% organic sales)",
    "8 ASINs are heavily ad-dependent (<30% organic sales)",
    "Overall ACoS: 20.00%",
    "Organic sales represent 40.00% of total revenue"
  ]
}
```

### 2. calculate_tacos

**Description**: Calculates Total Advertising Cost of Sales (TACoS) with advertising health analysis.

**Endpoint**: Does not use direct API, processes local report files.

**Parameters**:
- `adsReportPath` (string, required): Path to Ads API report file
- `sellerReportPath` (string, required): Path to Seller Central report file
- `dateRange` (object, optional): Date range filter

**Process**:
1. Reads and processes both reports
2. Calculates global metrics:
   - Total Ad Spend
   - Total Ad Attributed Sales
   - Total Sales (from Seller Central)
   - TACoS = (Total Ad Spend / Total Sales) * 100
   - ACoS = (Total Ad Spend / Total Ad Attributed Sales) * 100
   - Organic Sales = Total Sales - Ad Attributed Sales
   - Organic Percentage = (Organic Sales / Total Sales) * 100
3. Generates per-campaign breakdown:
   - Spend, Sales, ACoS per campaign
   - TACoS contribution per campaign
4. Determines health status based on TACoS:
   - < 5%: excellent
   - 5-10%: good
   - 10-15%: moderate
   - > 15%: poor
5. Generates contextual recommendations

**Response**:
```json
{
  "period": { "startDate": "2024-01-01", "endDate": "2024-01-31" },
  "metrics": {
    "totalSales": 10000.00,
    "totalAdSpend": 1200.00,
    "totalAdAttributedSales": 6000.00,
    "organicSales": 4000.00,
    "tacos": 12.00,
    "acos": 20.00,
    "organicPercentage": 40.00
  },
  "health": {
    "status": "moderate",
    "message": "TACoS is moderate (10-15%). Consider optimizing underperforming campaigns."
  },
  "campaignBreakdown": [
    {
      "campaignName": "SP - Wireless Headphones",
      "spend": 500.00,
      "sales": 2500.00,
      "acos": 20.00,
      "tacoSContribution": 5.00
    }
  ],
  "recommendations": [
    "Reduce spend on campaigns with ACoS > 50%",
    "Focus on improving organic ranking through better listings and reviews",
    "High ACoS and TACoS indicate inefficient ad spend. Review keyword bids and targeting."
  ]
}
```

### 3. analyze_organic_vs_ad_sales

**Description**: Analyzes the proportion of organic vs ad-attributed sales with flexible grouping.

**Endpoint**: Does not use direct API, processes local report files.

**Parameters**:
- `adsReportPath` (string, required): Path to Ads API report file
- `sellerReportPath` (string, required): Path to Seller Central report file
- `dateRange` (object, optional): Date range filter
- `groupBy` (enum, optional, default: asin): How to group the analysis
  - `asin`: Group by ASIN
  - `date`: Group by date
  - `campaign`: Group by campaign

**Process**:
1. Reads and processes both reports
2. Defines grouping function based on `groupBy`
3. Groups Ads and Seller Central data
4. For each group calculates:
   - Total Sales
   - Ad Attributed Sales
   - Organic Sales
   - Ad Spend
   - Organic Percentage
   - ACoS
5. Sorts by total sales descending
6. Calculates global metrics
7. Determines trend:
   - > 60% organic: improving
   - 40-60% organic: stable
   - < 40% organic: declining
8. Identifies top organic and ad-dependent performers

**Response**:
```json
{
  "period": { "startDate": "2024-01-01", "endDate": "2024-01-31" },
  "groupBy": "asin",
  "summary": {
    "totalGroups": 50,
    "totalSales": 10000.00,
    "totalAdAttributedSales": 6000.00,
    "totalOrganicSales": 4000.00,
    "totalAdSpend": 1200.00,
    "overallOrganicPercentage": 40.00,
    "overallAcos": 20.00
  },
  "trend": {
    "status": "stable",
    "message": "Balanced mix of organic and ad sales (40-60%)."
  },
  "breakdown": [
    {
      "group": "B08N5WRWNW",
      "totalSales": 2500.00,
      "adAttributedSales": 362.50,
      "organicSales": 2137.50,
      "adSpend": 150.00,
      "organicPercentage": 85.50,
      "acos": 41.38
    }
  ],
  "insights": [
    "15 asin(s) have >70% organic sales",
    "8 asin(s) have <30% organic sales",
    "Overall organic percentage: 40.00%",
    "Overall ACoS: 20.00%",
    "Top organic performers: B08N5WRWNW, B07XJ8C8F5, B09ABC1234",
    "Most ad-dependent: B07DEF5678, B07GHI9012, B07JKL3456"
  ]
}
```

## Architecture

### File Processing
- **Ads Reports**: Gzipped JSON, decompressed with `zlib.gunzipSync`
- **Seller Reports**: CSV (tab-delimited), JSON, or gzipped JSON
- **CSV Parser**: Uses `parseCSV` from `amazon-mcp-common` with header normalization

### Data Correlation
- Correlation by ASIN (common key between both systems)
- Handling of ASINs present in one system but not the other
- Calculation of organic sales as difference (Total - Ad Attributed)

### Metrics Calculation
- **TACoS**: Total Advertising Cost of Sales
  - Formula: (Total Ad Spend / Total Sales) * 100
  - Includes impact of ads on total sales (organic + attributed)
- **ACoS**: Advertising Cost of Sales
  - Formula: (Total Ad Spend / Ad Attributed Sales) * 100
  - Only considers ad-attributed sales
- **Organic Percentage**: (Organic Sales / Total Sales) * 100

### Health Assessment
- **TACoS Thresholds**:
  - < 5%: Excellent (very efficient)
  - 5-10%: Good (efficient)
  - 10-15%: Moderate (acceptable)
  - > 15%: Poor (needs optimization)

### Trend Analysis
- **Improving**: > 60% organic (strong organic presence)
- **Stable**: 40-60% organic (healthy balance)
- **Declining**: < 40% organic (high ad dependency)

## Testing

Unit tests cover:
- Reading and parsing CSV/JSON/gzipped files
- Data correlation by ASIN
- Metrics calculation (TACoS, ACoS, Organic %)
- Grouping by different dimensions
- Insights and recommendations generation

## Use Cases

### 1. Advertising Efficiency Evaluation
- Calculate TACoS to evaluate real impact of ads on total sales
- Compare with ACoS to understand ad dependency

### 2. Organic Opportunity Identification
- Identify ASINs with high organic performance (>70%)
- Analyze what makes them successful and replicate strategy

### 3. Ad Dependency Optimization
- Identify ASINs with low organic presence (<30%)
- Prioritize listing, reviews, and SEO improvements for these products

### 4. Temporal Analysis
- Use `groupBy: date` to analyze trends over time
- Identify if organic presence is improving or declining

### 5. Campaign Analysis
- Use `groupBy: campaign` to understand each campaign's contribution
- Identify campaigns generating more organic vs attributed sales

## Next Steps

- Phase 9: Testing, Documentation, Deployment
  - Integration tests with real data
  - Complete API documentation
  - Deployment and publishing scripts