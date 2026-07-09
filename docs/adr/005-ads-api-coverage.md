# ADR-005: Amazon Ads API Coverage

**Status:** Accepted  
**Date:** 2026-07-08  
**Decision:** Implement the three families of Amazon Ads API: Sponsored Products (SP), Sponsored Brands (SB), and Sponsored Display (SD).

## Context

Amazon Ads API has three main families of advertising products:

1. **Sponsored Products (SP)**: Product ads in search results and product pages
2. **Sponsored Brands (SB)**: Brand ads with logo, headline, and multiple products
3. **Sponsored Display (SD)**: Display ads for retargeting and audiences

Each family has its own endpoints and data models, but share similar patterns.

## Options Considered

### Option A: Only Sponsored Products
- Implement only SP (what is already used in DPA26 invoices)
- Leave SB and SD for the future

**Pros:**
- Less initial work
- Focused on what is already used
- SP does not require Brand Registry

**Cons:**
- Incomplete coverage
- Will have to be added later
- Does not take advantage of doing a complete implementation

### Option B: SP + SD (without SB)
- Implement SP and SD
- Leave SB for when Brand Registry is active

**Pros:**
- Covers two families without requiring Brand Registry
- SD is useful for retargeting

**Cons:**
- Still incomplete coverage
- SB will have to be added later

### Option C: SP + SB + SD (complete, chosen)
- Implement all three families from the start
- SB tools will fail with clear error until Brand Registry is active

**Pros:**
- Complete coverage from the start
- Takes advantage of doing a complete implementation
- Ready for when Brand Registry is active
- Consistent architecture for all three families

**Cons:**
- More initial work (~30% additional vs only SP)
- SB tools will fail until Brand Registry is active
- Requires clear error handling for SB

## Decision

**Option C: SP + SB + SD (complete)**

## Implementation

### Tools Structure

Tools will be organized by family:

```
packages/amazon-ads-mcp/src/tools/
├── sp/                    <- Sponsored Products
│   ├── campaigns.ts
│   ├── ad-groups.ts
│   ├── keywords.ts
│   ├── product-ads.ts
│   └── targets.ts
├── sb/                    <- Sponsored Brands
│   ├── campaigns.ts
│   ├── ad-groups.ts
│   ├── keywords.ts
│   └── ...
├── sd/                    <- Sponsored Display
│   ├── campaigns.ts
│   ├── ad-groups.ts
│   ├── targets.ts
│   └── ...
└── shared/
    └── reports.ts         <- Reports (shared across families)
```

### Error Handling for SB

If Brand Registry is not active, SB tools will return a clear error:

```typescript
{
  isError: true,
  content: [{
    type: 'text',
    text: 'Sponsored Brands API requires Brand Registry. Please activate Brand Registry in Seller Central and ensure your advertising account has access to Sponsored Brands.'
  }]
}
```

### Reports

Reports will be implemented in a shared way across the three families, with a `campaignType` parameter to specify SP, SB, or SD.

## Implementation Phases

- **Phase 4**: Data reading for all three families
- **Phase 5**: Async reports (shared)
- **Phase 6**: Writes for all three families
- **Phase 7**: Optimization and analysis (shared)

## Consequences

- ✅ Complete coverage for ads optimization
- ✅ Ready for when Brand Registry is active
- ✅ Consistent architecture for all three families
- ⚠️ More work in phases 4-6 (~30% additional vs only SP)
- ⚠️ SB tools will fail until Brand Registry is active (clear error handling)

## References

- [Amazon Ads API Documentation](https://advertising.amazon.com/API/docs)
- [Sponsored Products API](https://advertising.amazon.com/API/docs/en-us/sponsored-products/3-0/openapi/prod)
- [Sponsored Brands API](https://advertising.amazon.com/API/docs/en-us/sponsored-brands/3-0/openapi/prod)
- [Sponsored Display API](https://advertising.amazon.com/API/docs/en-us/sponsored-display/3-0/openapi/prod)