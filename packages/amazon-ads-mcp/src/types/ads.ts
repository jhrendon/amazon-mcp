export type CampaignState = 'ENABLED' | 'PAUSED' | 'ARCHIVED';
export type CampaignType = 'sponsoredProducts' | 'sponsoredBrands' | 'sponsoredDisplay';
export type AdGroupState = 'ENABLED' | 'PAUSED' | 'ARCHIVED';
export type KeywordState = 'ENABLED' | 'PAUSED' | 'ARCHIVED';
export type KeywordMatchType = 'EXACT' | 'PHRASE' | 'BROAD';
export type TargetState = 'ENABLED' | 'PAUSED' | 'ARCHIVED';
export type ProductAdState = 'ENABLED' | 'PAUSED' | 'ARCHIVED';

export interface Campaign {
  campaignId: number;
  name: string;
  campaignType: CampaignType;
  targetingType?: string;
  state: CampaignState;
  dailyBudget?: number;
  startDate?: string;
  endDate?: string;
  premiumBidAdjustment?: boolean;
  bidding?: {
    strategy?: string;
    adjustments?: Array<{
      predicate: string;
      percentage: number;
    }>;
  };
}

export interface AdGroup {
  adGroupId: number;
  campaignId: number;
  name: string;
  defaultBid?: number;
  state: AdGroupState;
}

export interface Keyword {
  keywordId: number;
  campaignId: number;
  adGroupId: number;
  keywordText: string;
  matchType: KeywordMatchType;
  state: KeywordState;
  bid?: number;
}

export interface Target {
  targetId: number;
  campaignId: number;
  adGroupId: number;
  state: TargetState;
  expressionType?: string;
  expression?: Array<{
    type: string;
    value: string;
  }>;
  bid?: number;
}

export interface ProductAd {
  adId: number;
  campaignId: number;
  adGroupId: number;
  asin: string;
  sku?: string;
  state: ProductAdState;
}

export type NegativeKeywordMatchType = 'NEGATIVE_EXACT' | 'NEGATIVE_PHRASE';

export interface NegativeKeyword {
  keywordId: number;
  campaignId: number;
  adGroupId: number;
  keywordText: string;
  matchType: NegativeKeywordMatchType;
  state: KeywordState;
}

export interface NegativeTarget {
  targetId: number;
  campaignId: number;
  adGroupId: number;
  state: TargetState;
  expressionType?: string;
  expression?: Array<{
    type: string;
    value: string;
  }>;
}

export interface ListParams {
  stateFilter?: string;
  campaignIdFilter?: number[];
  adGroupIdFilter?: number[];
  keywordIdFilter?: number[];
  pageSize?: number;
  startIndex?: number;
}
