# Phase 21: Portfolios (Ads)

**Status:** Planned  
**Date:** 2026-07-09

Tools for managing Amazon Ads portfolios to organize campaigns into logical groups with shared budgets.

---

## 1. Portfolios (5 tools)

### list_portfolios

- **Description:** List all portfolios in the advertising account.
- **Endpoint:** `GET /v2/portfolios`
- **Rate Limit Category:** `portfolios`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `portfolioIdFilter` | `number[]` | No | Filter by portfolio IDs |
| `portfolioNameFilter` | `string[]` | No | Filter by portfolio names |
| `portfolioStateFilter` | `enum` (`enabled`, `paused`, `archived`) | No | Filter by state |

- **Response:**
```json
{
  "portfolios": [
    {
      "portfolioId": 123456,
      "name": "Holiday Campaigns",
      "budget": {
        "amount": 5000.00,
        "currencyCode": "USD",
        "policy": "dateRange",
        "startDate": "2025-11-01",
        "endDate": "2025-12-31"
      },
      "inBudget": true,
      "state": "enabled"
    }
  ],
  "count": 1
}
```

---

### get_portfolio

- **Description:** Get details for a specific portfolio.
- **Endpoint:** `GET /v2/portfolios/{portfolioId}`
- **Rate Limit Category:** `portfolios`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `portfolioId` | `number` | **Yes** | Portfolio ID |

- **Response:** Portfolio object (same shape as list_portfolios item)

---

### create_portfolios

- **Description:** Create one or more portfolios (batch, up to 100).
- **Endpoint:** `POST /v2/portfolios`
- **Rate Limit Category:** `portfolios`
- **Parameters:** Array of:

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | **Yes** | Portfolio name |
| `budget` | `object` | No | Budget with amount, policy (`dateRange` or `monthlyRecurring`), startDate, endDate |
| `state` | `enum` (`enabled`, `paused`) | No | Portfolio state (default: `enabled`) |

- **Response:**
```json
{
  "portfolios": [
    {
      "portfolioId": 789012,
      "code": "SUCCESS",
      "description": "Portfolio created successfully"
    }
  ]
}
```

---

### update_portfolios

- **Description:** Update one or more portfolios (batch, up to 100).
- **Endpoint:** `PUT /v2/portfolios`
- **Rate Limit Category:** `portfolios`
- **Parameters:** Array of:

| Parameter | Type | Required | Description |
|---|---|---|---|
| `portfolioId` | `number` | **Yes** | Portfolio ID to update |
| `name` | `string` | No | Updated portfolio name |
| `budget` | `object` | No | Updated budget |
| `state` | `enum` (`enabled`, `paused`, `archived`) | No | Updated state |

- **Response:**
```json
{
  "portfolios": [
    {
      "portfolioId": 789012,
      "code": "SUCCESS",
      "description": "Portfolio updated successfully"
    }
  ]
}
```

---

### get_portfolio_extended

- **Description:** Get extended portfolio details including campaign count and total spend.
- **Endpoint:** `GET /v2/portfolios/extended/{portfolioId}`
- **Rate Limit Category:** `portfolios`
- **Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `portfolioId` | `number` | **Yes** | Portfolio ID |

- **Response:**
```json
{
  "portfolioId": 123456,
  "name": "Holiday Campaigns",
  "budget": {
    "amount": 5000.00,
    "currencyCode": "USD",
    "policy": "dateRange",
    "startDate": "2025-11-01",
    "endDate": "2025-12-31"
  },
  "inBudget": true,
  "state": "enabled",
  "campaignCount": 12,
  "totalSpend": 3250.00
}
```

---

## Architecture

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `portfolios` | 2 | 10 |

### Portfolio Budget Policies

- `dateRange` — Budget applies between startDate and endDate
- `monthlyRecurring` — Budget resets monthly

### Use Cases

- Organize campaigns by product line, season, or strategy
- Set shared budgets across multiple campaigns
- Pause entire campaign groups with a single portfolio state change
- Track spend across related campaigns

---

## Tools Summary

| # | Category | Tools | Count |
|---|---|---|---|
| 1 | Portfolios | list_portfolios, get_portfolio, create_portfolios, update_portfolios, get_portfolio_extended | 5 |
| | **Total** | | **5** |

---

## Next Steps

- Integration with campaign management (assign campaigns to portfolios)
