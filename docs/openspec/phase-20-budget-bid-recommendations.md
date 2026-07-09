# Phase 20: Budget & Bid Recommendations (Ads)

**Status:** Planned  
**Date:** 2026-07-09

Tools for getting Amazon Ads budget and bid recommendations to optimize campaign performance.

---

## 1. Budget Recommendations (4 tools)

### sp_get_budget_recommendations

- **Description:** Get budget recommendations for SP campaigns based on historical performance.
- **Endpoint:** `POST /v2/sp/campaigns/budgetRecommendations`
- **Rate Limit Category:** `budgetRecommendations`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `campaignId` | `number` | **Yes** | Campaign ID |
| `dateRange` | `object` | No | Date range for analysis |

- **Response:**
```json
{
  "campaignId": 123456,
  "recommendedBudget": 75.00,
  "currentBudget": 50.00,
  "estimatedMissedSales": 500.00,
  "estimatedMissedClicks": 200,
  "estimatedMissedImpressions": 5000,
  "budgetRecommendationRange": { "lower": 60.00, "upper": 100.00 }
}
```

---

### sp_get_campaign_budget_recommendations

- **Description:** Get budget recommendations for multiple SP campaigns.
- **Endpoint:** `POST /v2/sp/campaigns/budgetRecommendations/batch`
- **Rate Limit Category:** `budgetRecommendations`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `campaignIds` | `number[]` | **Yes** | Campaign IDs (max 100) |

- **Response:** Array of budget recommendation objects (same shape as single campaign)

---

### sb_get_budget_recommendations

- **Description:** Get budget recommendations for SB campaigns.
- **Endpoint:** `POST /v2/hs/campaigns/budgetRecommendations`
- **Rate Limit Category:** `budgetRecommendations`
- **Note:** Requires Brand Registry. Returns 403 error with `BRAND_REGISTRY_REQUIRED` if not active.
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `campaignId` | `number` | **Yes** | Campaign ID |
| `dateRange` | `object` | No | Date range for analysis |

- **Response:** Same shape as SP budget recommendations

---

### sd_get_budget_recommendations

- **Description:** Get budget recommendations for SD campaigns.
- **Endpoint:** `POST /sd/campaigns/budgetRecommendations`
- **Rate Limit Category:** `budgetRecommendations`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `campaignId` | `number` | **Yes** | Campaign ID |
| `dateRange` | `object` | No | Date range for analysis |

- **Response:** Same shape as SP budget recommendations

---

## 2. Bid Recommendations (4 tools)

### sp_get_bid_recommendations

- **Description:** Get bid recommendations for SP keywords or targets.
- **Endpoint:** `POST /v2/sp/keywords/bidding/recommendations`
- **Rate Limit Category:** `bidRecommendations`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `adGroupId` | `number` | **Yes** | Ad group ID |
| `keywords` | `array` | No | Keywords to get recommendations for |
| `targets` | `array` | No | Targets to get recommendations for |

- **Response:**
```json
{
  "adGroupId": 456,
  "recommendations": [
    {
      "keyword": "wireless headphones",
      "matchType": "BROAD",
      "suggestedBid": { "value": 1.25, "rangeStart": 0.80, "rangeEnd": 2.00 },
      "estimatedImpressions": 5000,
      "estimatedClicks": 250
    }
  ]
}
```

---

### sp_get_target_bid_recommendations

- **Description:** Get bid recommendations specifically for product targets.
- **Endpoint:** `POST /v2/sp/targets/bidding/recommendations`
- **Rate Limit Category:** `bidRecommendations`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `adGroupId` | `number` | **Yes** | Ad group ID |
| `targets` | `array` | **Yes** | Product targets to get recommendations for |

- **Response:** Array of target bid recommendation objects

---

### sb_get_bid_recommendations

- **Description:** Get bid recommendations for SB keywords.
- **Endpoint:** `POST /v2/hs/keywords/bidding/recommendations`
- **Rate Limit Category:** `bidRecommendations`
- **Note:** Requires Brand Registry. Returns 403 error with `BRAND_REGISTRY_REQUIRED` if not active.
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `adGroupId` | `number` | **Yes** | Ad group ID |
| `keywords` | `array` | No | Keywords to get recommendations for |

- **Response:** Same shape as SP bid recommendations

---

### sd_get_bid_recommendations

- **Description:** Get bid recommendations for SD targets.
- **Endpoint:** `POST /sd/targets/bidding/recommendations`
- **Rate Limit Category:** `bidRecommendations`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `adGroupId` | `number` | **Yes** | Ad group ID |
| `targets` | `array` | No | Targets to get recommendations for |

- **Response:** Same shape as SP bid recommendations

---

## 3. Budget Rules (3 tools)

### sp_list_budget_rules

- **Description:** List automated budget rules for SP campaigns.
- **Endpoint:** `GET /v2/sp/campaigns/budgetRules`
- **Rate Limit Category:** `budgetRules`
- **Parameters:** `{}` (no parameters)
- **Response:** `{ budgetRules: [{ ruleId, name, ruleType, state, campaignIds, ruleDetails }], count }`

---

### sp_create_budget_rule

- **Description:** Create an automated budget rule (e.g., increase budget by 20% when ACoS < 30%).
- **Endpoint:** `POST /v2/sp/campaigns/budgetRules`
- **Rate Limit Category:** `budgetRules`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | **Yes** | Rule name |
| `ruleType` | `enum` (`SCHEDULE`, `PERFORMANCE`) | **Yes** | Rule type |
| `campaignIds` | `number[]` | **Yes** | Campaigns to apply rule to |
| `ruleDetails` | `object` | **Yes** | Rule conditions and actions |

- **Response:**
```json
{
  "ruleId": 789,
  "name": "Scale winners",
  "ruleType": "PERFORMANCE",
  "state": "ENABLED",
  "campaignIds": [123, 456]
}
```

---

### sp_update_budget_rule

- **Description:** Update an existing budget rule.
- **Endpoint:** `PUT /v2/sp/campaigns/budgetRules`
- **Rate Limit Category:** `budgetRules`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `ruleId` | `number` | **Yes** | Rule ID to update |
| `name` | `string` | No | Updated rule name |
| `ruleDetails` | `object` | No | Updated rule conditions and actions |
| `state` | `enum` (`ENABLED`, `PAUSED`) | No | Updated state |

- **Response:** Updated budget rule object

---

## Architecture

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `budgetRecommendations` | 2 | 10 |
| `bidRecommendations` | 2 | 10 |
| `budgetRules` | 2 | 10 |

### Budget Rule Types

- **SCHEDULE:** Increase/decrease budget on specific dates (e.g., Black Friday)
- **PERFORMANCE:** Adjust budget based on performance metrics (e.g., ACoS threshold)

### Brand Registry Handling

- All SB tools handle HTTP 403 with `BRAND_REGISTRY_REQUIRED` error
- Clear message: "Sponsored Brands API requires Brand Registry"

### API Prefix Conventions

| Family | Prefix | Example |
|---|---|---|
| Sponsored Products | `/v2/sp/` | `/v2/sp/campaigns/budgetRecommendations` |
| Sponsored Brands | `/v2/hs/` | `/v2/hs/campaigns/budgetRecommendations` |
| Sponsored Display | `/sd/` | `/sd/campaigns/budgetRecommendations` |

---

## Tools Summary

| # | Category | Tools | Count |
|---|---|---|---|
| 1 | Budget Recommendations | sp_get_budget_recommendations, sp_get_campaign_budget_recommendations, sb_get_budget_recommendations, sd_get_budget_recommendations | 4 |
| 2 | Bid Recommendations | sp_get_bid_recommendations, sp_get_target_bid_recommendations, sb_get_bid_recommendations, sd_get_bid_recommendations | 4 |
| 3 | Budget Rules | sp_list_budget_rules, sp_create_budget_rule, sp_update_budget_rule | 3 |
| | **Total** | | **11** |

---

## Next Steps

- Phase 21: Portfolios
