export type ReportType =
  | 'spCampaigns'
  | 'spAdGroups'
  | 'spKeywords'
  | 'spTargets'
  | 'spProductAds'
  | 'sbCampaigns'
  | 'sbAdGroups'
  | 'sbKeywords'
  | 'sdCampaigns'
  | 'sdAdGroups'
  | 'sdTargets';

export interface ReportRequest {
  reportDate?: string;
  segment?: string;
  metrics?: string[];
}

export interface ReportResponse {
  reportId: string;
  recordId: string;
}

export interface ReportStatusResponse {
  reportId: string;
  status: 'IN_PROGRESS' | 'DONE' | 'FAILURE';
  statusDetails?: string;
  location?: string;
  fileSize?: number;
}
