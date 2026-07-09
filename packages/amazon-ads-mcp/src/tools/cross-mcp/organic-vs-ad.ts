import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { makeToolResponse } from 'amazon-mcp-common';
import { readFileSync, existsSync } from 'fs';
import { gunzipSync } from 'zlib';

const analyzeOrganicVsAdSalesSchema = z.object({
  adsReportPath: z.string().describe('Path to the Ads API report file (gzipped JSON)'),
  sellerReportPath: z.string().describe('Path to the Seller Central sales report file (CSV or JSON)'),
  dateRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).optional().describe('Date range to filter (YYYY-MM-DD)'),
  groupBy: z.enum(['asin', 'date', 'campaign']).optional().default('asin').describe('How to group the analysis'),
});

interface AdsReportRecord {
  campaignId?: number;
  campaignName?: string;
  asin?: string;
  cost?: number;
  sales?: number;
  date?: string;
}

interface SellerReportRecord {
  asin?: string;
  'total-ordered-product-sales'?: string;
  date?: string;
}

function readAdsReport(filePath: string): AdsReportRecord[] {
  if (!existsSync(filePath)) {
    throw new Error(`Ads report file not found: ${filePath}`);
  }

  const compressed = readFileSync(filePath);
  const decompressed = gunzipSync(compressed);
  return JSON.parse(decompressed.toString('utf-8'));
}

function readSellerReport(filePath: string): SellerReportRecord[] {
  if (!existsSync(filePath)) {
    throw new Error(`Seller Central report file not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');
  
  if (filePath.endsWith('.json')) {
    return JSON.parse(content);
  }
  
  if (filePath.endsWith('.gz')) {
    const compressed = readFileSync(filePath);
    const decompressed = gunzipSync(compressed);
    return JSON.parse(decompressed.toString('utf-8'));
  }
  
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split('\t');
  const records: SellerReportRecord[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    const record: SellerReportRecord = {};
    
    headers.forEach((header, index) => {
      (record as Record<string, string>)[header] = values[index] || '';
    });
    
    records.push(record);
  }
  
  return records;
}

export function registerOrganicVsAdTools(server: McpServer): void {
  server.registerTool(
    'analyze_organic_vs_ad_sales',
    {
      description: 'Analyze the proportion of organic vs ad-attributed sales. Requires report files from both systems.',
      inputSchema: analyzeOrganicVsAdSalesSchema,
    },
    async (input) => {
      try {
        const adsRecords = readAdsReport(input.adsReportPath);
        const sellerRecords = readSellerReport(input.sellerReportPath);

        let filteredAds = adsRecords;
        let filteredSeller = sellerRecords;

        if (input.dateRange) {
          const start = new Date(input.dateRange.startDate);
          const end = new Date(input.dateRange.endDate);

          filteredAds = adsRecords.filter(r => {
            if (!r.date) return true;
            const date = new Date(r.date);
            return date >= start && date <= end;
          });

          filteredSeller = sellerRecords.filter(r => {
            if (!r.date) return true;
            const date = new Date(r.date);
            return date >= start && date <= end;
          });
        }

        const groupKey = (record: AdsReportRecord | SellerReportRecord): string => {
          if (input.groupBy === 'asin') {
            return (record as AdsReportRecord).asin || (record as SellerReportRecord).asin || 'unknown';
          } else if (input.groupBy === 'date') {
            return record.date || 'unknown';
          } else {
            return (record as AdsReportRecord).campaignName || 'unknown';
          }
        };

        const adsByGroup = new Map<string, { spend: number; sales: number }>();
        filteredAds.forEach(r => {
          const key = groupKey(r);
          if (!adsByGroup.has(key)) {
            adsByGroup.set(key, { spend: 0, sales: 0 });
          }
          const group = adsByGroup.get(key)!;
          group.spend += r.cost || 0;
          group.sales += r.sales || 0;
        });

        const sellerByGroup = new Map<string, number>();
        filteredSeller.forEach(r => {
          const key = groupKey(r);
          const sales = parseFloat(r['total-ordered-product-sales'] || '0');
          const current = sellerByGroup.get(key) || 0;
          sellerByGroup.set(key, current + (isNaN(sales) ? 0 : sales));
        });

        const allGroups = new Set([...adsByGroup.keys(), ...sellerByGroup.keys()]);
        
        const breakdown = Array.from(allGroups).map(group => {
          const adsData = adsByGroup.get(group) || { spend: 0, sales: 0 };
          const totalSales = sellerByGroup.get(group) || 0;
          const adAttributedSales = adsData.sales;
          const organicSales = Math.max(0, totalSales - adAttributedSales);
          const organicPercentage = totalSales > 0 ? (organicSales / totalSales) * 100 : 0;
          const acos = adAttributedSales > 0 ? (adsData.spend / adAttributedSales) * 100 : 0;

          return {
            group,
            totalSales: Math.round(totalSales * 100) / 100,
            adAttributedSales: Math.round(adAttributedSales * 100) / 100,
            organicSales: Math.round(organicSales * 100) / 100,
            adSpend: Math.round(adsData.spend * 100) / 100,
            organicPercentage: Math.round(organicPercentage * 100) / 100,
            acos: Math.round(acos * 100) / 100,
          };
        });

        breakdown.sort((a, b) => b.totalSales - a.totalSales);

        const totalSalesAll = breakdown.reduce((sum, b) => sum + b.totalSales, 0);
        const totalAdSales = breakdown.reduce((sum, b) => sum + b.adAttributedSales, 0);
        const totalOrganicSales = breakdown.reduce((sum, b) => sum + b.organicSales, 0);
        const totalAdSpend = breakdown.reduce((sum, b) => sum + b.adSpend, 0);

        const overallOrganicPercentage = totalSalesAll > 0 ? (totalOrganicSales / totalSalesAll) * 100 : 0;
        const overallAcos = totalAdSales > 0 ? (totalAdSpend / totalAdSales) * 100 : 0;

        const highOrganic = breakdown.filter(b => b.organicPercentage > 70 && b.totalSales > 100);
        const lowOrganic = breakdown.filter(b => b.organicPercentage < 30 && b.totalSales > 100);

        let trend: 'improving' | 'stable' | 'declining';
        let trendMessage: string;

        if (overallOrganicPercentage > 60) {
          trend = 'improving';
          trendMessage = 'Strong organic presence (>60%). Your products are gaining organic traction.';
        } else if (overallOrganicPercentage > 40) {
          trend = 'stable';
          trendMessage = 'Balanced mix of organic and ad sales (40-60%).';
        } else {
          trend = 'declining';
          trendMessage = 'Heavy reliance on ads (<40% organic). Focus on improving organic rankings.';
        }

        const insights: string[] = [
          `${highOrganic.length} ${input.groupBy}(s) have >70% organic sales`,
          `${lowOrganic.length} ${input.groupBy}(s) have <30% organic sales`,
          `Overall organic percentage: ${overallOrganicPercentage.toFixed(2)}%`,
          `Overall ACoS: ${overallAcos.toFixed(2)}%`,
        ];

        if (highOrganic.length > 0) {
          insights.push(`Top organic performers: ${highOrganic.slice(0, 3).map(h => h.group).join(', ')}`);
        }

        if (lowOrganic.length > 0) {
          insights.push(`Most ad-dependent: ${lowOrganic.slice(0, 3).map(l => l.group).join(', ')}`);
        }

        return makeToolResponse({
          period: input.dateRange || { startDate: 'all', endDate: 'all' },
          groupBy: input.groupBy,
          summary: {
            totalGroups: breakdown.length,
            totalSales: Math.round(totalSalesAll * 100) / 100,
            totalAdAttributedSales: Math.round(totalAdSales * 100) / 100,
            totalOrganicSales: Math.round(totalOrganicSales * 100) / 100,
            totalAdSpend: Math.round(totalAdSpend * 100) / 100,
            overallOrganicPercentage: Math.round(overallOrganicPercentage * 100) / 100,
            overallAcos: Math.round(overallAcos * 100) / 100,
          },
          trend: {
            status: trend,
            message: trendMessage,
          },
          breakdown: breakdown.slice(0, 50),
          insights,
        });
      } catch (error) {
        throw new Error(`Failed to analyze organic vs ad sales: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
