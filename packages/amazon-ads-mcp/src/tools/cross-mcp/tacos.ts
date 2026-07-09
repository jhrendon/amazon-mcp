import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { makeToolResponse } from 'amazon-mcp-common';
import { readFileSync, existsSync } from 'fs';
import { gunzipSync } from 'zlib';

const calculateTacosSchema = z.object({
  adsReportPath: z.string().describe('Path to the Ads API report file (gzipped JSON)'),
  sellerReportPath: z.string().describe('Path to the Seller Central sales report file (CSV or JSON)'),
  dateRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).optional().describe('Date range to filter (YYYY-MM-DD)'),
});

interface AdsReportRecord {
  campaignId?: number;
  campaignName?: string;
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

export function registerTacosTools(server: McpServer): void {
  server.registerTool(
    'calculate_tacos',
    {
      description: 'Calculate Total Advertising Cost of Sales (TACoS). Requires report files from both Ads API and Seller Central.',
      inputSchema: calculateTacosSchema,
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

        const totalAdSpend = filteredAds.reduce((sum, r) => sum + (r.cost || 0), 0);
        const totalAdAttributedSales = filteredAds.reduce((sum, r) => sum + (r.sales || 0), 0);

        const totalSales = filteredSeller.reduce((sum, r) => {
          const sales = parseFloat(r['total-ordered-product-sales'] || '0');
          return sum + (isNaN(sales) ? 0 : sales);
        }, 0);

        const tacos = totalSales > 0 ? (totalAdSpend / totalSales) * 100 : 0;
        const acos = totalAdAttributedSales > 0 ? (totalAdSpend / totalAdAttributedSales) * 100 : 0;
        const organicSales = Math.max(0, totalSales - totalAdAttributedSales);
        const organicPercentage = totalSales > 0 ? (organicSales / totalSales) * 100 : 0;

        const adsByCampaign = new Map<string, { spend: number; sales: number }>();
        filteredAds.forEach(r => {
          const campaignName = r.campaignName || `Campaign ${r.campaignId}`;
          if (!adsByCampaign.has(campaignName)) {
            adsByCampaign.set(campaignName, { spend: 0, sales: 0 });
          }
          const campaign = adsByCampaign.get(campaignName)!;
          campaign.spend += r.cost || 0;
          campaign.sales += r.sales || 0;
        });

        const campaignBreakdown = Array.from(adsByCampaign.entries())
          .map(([name, data]) => ({
            campaignName: name,
            spend: Math.round(data.spend * 100) / 100,
            sales: Math.round(data.sales * 100) / 100,
            acos: data.sales > 0 ? Math.round((data.spend / data.sales) * 10000) / 100 : 0,
            tacoSContribution: totalSales > 0 ? Math.round((data.spend / totalSales) * 10000) / 100 : 0,
          }))
          .sort((a, b) => b.spend - a.spend)
          .slice(0, 20);

        let healthStatus: 'excellent' | 'good' | 'moderate' | 'poor';
        let healthMessage: string;

        if (tacos < 5) {
          healthStatus = 'excellent';
          healthMessage = 'TACoS is excellent (<5%). Your advertising is highly efficient.';
        } else if (tacos < 10) {
          healthStatus = 'good';
          healthMessage = 'TACoS is good (5-10%). Your advertising is performing well.';
        } else if (tacos < 15) {
          healthStatus = 'moderate';
          healthMessage = 'TACoS is moderate (10-15%). Consider optimizing underperforming campaigns.';
        } else {
          healthStatus = 'poor';
          healthMessage = 'TACoS is high (>15%). Urgent optimization needed to improve profitability.';
        }

        const recommendations: string[] = [];
        
        if (tacos > 10) {
          recommendations.push('Reduce spend on campaigns with ACoS > 50%');
        }
        
        if (organicPercentage < 50) {
          recommendations.push('Focus on improving organic ranking through better listings and reviews');
        }
        
        if (acos > 30 && tacos > 10) {
          recommendations.push('High ACoS and TACoS indicate inefficient ad spend. Review keyword bids and targeting.');
        }

        if (recommendations.length === 0) {
          recommendations.push('Advertising performance is healthy. Continue monitoring and optimizing.');
        }

        return makeToolResponse({
          period: input.dateRange || { startDate: 'all', endDate: 'all' },
          metrics: {
            totalSales: Math.round(totalSales * 100) / 100,
            totalAdSpend: Math.round(totalAdSpend * 100) / 100,
            totalAdAttributedSales: Math.round(totalAdAttributedSales * 100) / 100,
            organicSales: Math.round(organicSales * 100) / 100,
            tacos: Math.round(tacos * 100) / 100,
            acos: Math.round(acos * 100) / 100,
            organicPercentage: Math.round(organicPercentage * 100) / 100,
          },
          health: {
            status: healthStatus,
            message: healthMessage,
          },
          campaignBreakdown,
          recommendations,
        });
      } catch (error) {
        throw new Error(`Failed to calculate TACoS: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
