# OpenSpec: Amazon Ads MCP - Phase 6 (Writes)

## Summary

Implementation of write tools to update campaigns, ad groups, keywords and bids across the three Amazon Ads API families (SP, SB, SD).

## Implemented Tools

### Sponsored Products (7 tools)

#### sp_update_campaign
- **Description**: Updates a Sponsored Products campaign
- **Endpoint**: `PUT /v2/sp/campaigns`
- **Parameters**:
  - `campaignId` (number, required): Campaign ID
  - `name` (string, optional): New name
  - `state` (enum, optional): ENABLED | PAUSED | ARCHIVED
  - `dailyBudget` (number, optional): New daily budget
- **Response**: Updated campaign object

#### sp_pause_campaign
- **Description**: Pauses an SP campaign (shortcut)
- **Endpoint**: `PUT /v2/sp/campaigns`
- **Parameters**:
  - `campaignId` (number, required): Campaign ID
- **Response**: Campaign object with state=PAUSED

#### sp_enable_campaign
- **Description**: Enables an SP campaign (shortcut)
- **Endpoint**: `PUT /v2/sp/campaigns`
- **Parameters**:
  - `campaignId` (number, required): Campaign ID
- **Response**: Campaign object with state=ENABLED

#### sp_update_ad_group
- **Description**: Updates an SP ad group
- **Endpoint**: `PUT /v2/sp/adGroups`
- **Parameters**:
  - `adGroupId` (number, required): Ad group ID
  - `name` (string, optional): New name
  - `state` (enum, optional): ENABLED | PAUSED | ARCHIVED
  - `defaultBid` (number, optional): Default bid
- **Response**: Updated ad group object

#### sp_update_keyword
- **Description**: Updates an SP keyword
- **Endpoint**: `PUT /v2/sp/keywords`
- **Parameters**:
  - `keywordId` (number, required): Keyword ID
  - `state` (enum, optional): ENABLED | PAUSED | ARCHIVED
  - `bid` (number, optional): New bid
- **Response**: Updated keyword object

#### sp_update_keyword_bid
- **Description**: Updates a keyword's bid (shortcut)
- **Endpoint**: `PUT /v2/sp/keywords`
- **Parameters**:
  - `keywordId` (number, required): Keyword ID
  - `bid` (number, required): New bid
- **Response**: Keyword object with updated bid

#### sp_create_keyword
- **Description**: Creates a new keyword in SP
- **Endpoint**: `POST /v2/sp/keywords`
- **Parameters**:
  - `campaignId` (number, required): Campaign ID
  - `adGroupId` (number, required): Ad group ID
  - `keywordText` (string, required): Keyword text
  - `matchType` (enum, required): EXACT | PHRASE | BROAD
  - `bid` (number, optional): Initial bid
  - `state` (enum, optional, default: ENABLED): ENABLED | PAUSED
- **Response**: Created keyword object

### Sponsored Brands (7 tools)

Same operations as SP but with `/v2/hs/*` endpoints:
- `sb_update_campaign`
- `sb_pause_campaign`
- `sb_enable_campaign`
- `sb_update_ad_group`
- `sb_update_keyword`
- `sb_update_keyword_bid`
- `sb_create_keyword`

**Note**: Requires active Brand Registry. Returns 403 error if not active.

### Sponsored Display (4 tools)

#### sd_update_campaign
- **Description**: Updates an SD campaign
- **Endpoint**: `PUT /sd/campaigns`
- **Parameters**: campaignId, name, state, dailyBudget

#### sd_pause_campaign
- **Description**: Pauses an SD campaign
- **Endpoint**: `PUT /sd/campaigns`
- **Parameters**: campaignId

#### sd_enable_campaign
- **Description**: Enables an SD campaign
- **Endpoint**: `PUT /sd/campaigns`
- **Parameters**: campaignId

#### sd_update_ad_group
- **Description**: Updates an SD ad group
- **Endpoint**: `PUT /sd/adGroups`
- **Parameters**: adGroupId, name, state, defaultBid

**Note**: SD does not support keywords (uses targets instead).

## Architecture

### Rate Limiting
- All write operations use rate limiter with specific category:
  - `campaigns`: 2 req/s, burst 10
  - `adGroups`: 2 req/s, burst 10
  - `keywords`: 2 req/s, burst 10

### Error Handling
- API errors propagate with additional context
- Brand Registry errors (403) include specific message for SB
- Input validation with Zod schemas

### Response Format
```typescript
{
  content: [{ type: 'text', text: string }],
  structuredContent: {
    // Updated object data
    message: string
  }
}
```

## Testing

Unit tests cover:
- Required parameter validation
- Correct endpoint calls
- API error handling
- Successful responses

## Next Steps

- Phase 7: Optimization tools (keyword suggestions, analysis, negative keywords)