import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { makeToolResponse } from 'amazon-mcp-common';
import { readFileSync, existsSync } from 'fs';
import { gunzipSync } from 'zlib';

const correlateAdsWithSalesSchema = z.object({
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
  adGroupId?: number;
  keywordId?: number;
  keywordText?: string;
  asin?: string;
  impressions?: number;
  clicks?: number;
  cost?: number;
  sales?: number;
  orders?: number;
  date?: string;
}

interface SellerReportRecord {
  'product-name'?: string;
  asin?: string;
  'total-ordered-product-sales'?: string;
  'total-ordered-product-sales-shipped'?: string;
  'total-order-items'?: string;
  'total-order-items-shipped'?: string;
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

export function registerCrossMcpTools(server: McpServer): void {
  server.registerTool(
    'correlate_ads_with_sales',
    {
      description: 'Correlate Amazon Ads data with Seller Central sales data. Requires report files from both systems.',
      inputSchema: correlateAdsWithSalesSchema,
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

        const adsByAsin = new Map<string, AdsReportRecord[]>();
        filteredAds.forEach(r => {
          if (r.asin) {
            if (!adsByAsin.has(r.asin)) {
              adsByAsin.set(r.asin, []);
            }
            adsByAsin.get(r.asin)!.push(r);
          }
        });

        const sellerByAsin = new Map<string, SellerReportRecord[]>();
        filteredSeller.forEach(r => {
          const asin = r.asin;
          if (asin) {
            if (!sellerByAsin.has(asin)) {
              sellerByAsin.set(asin, []);
            }
            sellerByAsin.get(asin)!.push(r);
          }
        });

        const allAsins = new Set([...adsByAsin.keys(), ...sellerByAsin.keys()]);
        const correlations: Array<{
          asin: string;
          totalSales: number;
          adAttributedSales: number;
          organicSales: number;
          adSpend: number;
          acos: number;
          organicPercentage: number;
        }> = [];

        allAsins.forEach(asin => {
          const adsData = adsByAsin.get(asin) || [];
          const sellerData = sellerByAsin.get(asin) || [];

          const totalSales = sellerData.reduce((sum, r) => {
            const sales = parseFloat(r['total-ordered-product-sales'] || '0');
            return sum + (isNaN(sales) ? 0 : sales);
          }, 0);

          const adAttributedSales = adsData.reduce((sum, r) => sum + (r.sales || 0), 0);
          const organicSales = Math.max(0, totalSales - adAttributedSales);
          const adSpend = adsData.reduce((sum, r) => sum + (r.cost || 0), 0);
          const acos = adAttributedSales > 0 ? (adSpend / adAttributedSales) * 100 : 0;
          const organicPercentage = totalSales > 0 ? (organicSales / totalSales) * 100 : 0;

          correlations.push({
            asin,
            totalSales: Math.round(totalSales * 100) / 100,
            adAttributedSales: Math.round(adAttributedSales * 100) / 100,
            organicSales: Math.round(organicSales * 100) / 100,
            adSpend: Math.round(adSpend * 100) / 100,
            acos: Math.round(acos * 100) / 100,
            organicPercentage: Math.round(organicPercentage * 100) / 100,
          });
        });

        correlations.sort((a, b) => b.totalSales - a.totalSales);

        const totalSalesAll = correlations.reduce((sum, c) => sum + c.totalSales, 0);
        const totalAdSales = correlations.reduce((sum, c) => sum + c.adAttributedSales, 0);
        const totalOrganicSales = correlations.reduce((sum, c) => sum + c.organicSales, 0);
        const totalAdSpend = correlations.reduce((sum, c) => sum + c.adSpend, 0);
        const overallAcos = totalAdSales > 0 ? (totalAdSpend / totalAdSales) * 100 : 0;
        const overallOrganicPercentage = totalSalesAll > 0 ? (totalOrganicSales / totalSalesAll) * 100 : 0;

        const highOrganic = correlations.filter(c => c.organicPercentage > 70 && c.totalSales > 100);
        const highAdDependent = correlations.filter(c => c.organicPercentage < 30 && c.totalSales > 100);

        return makeToolResponse({
          period: input.dateRange || { startDate: 'all', endDate: 'all' },
          summary: {
            totalAsins: correlations.length,
            totalSales: Math.round(totalSalesAll * 100) / 100,
            totalAdAttributedSales: Math.round(totalAdSales * 100) / 100,
            totalOrganicSales: Math.round(totalOrganicSales * 100) / 100,
            totalAdSpend: Math.round(totalAdSpend * 100) / 100,
            overallAcos: Math.round(overallAcos * 100) / 100,
            overallOrganicPercentage: Math.round(overallOrganicPercentage * 100) / 100,
          },
          highOrganicAsins: highOrganic.slice(0, 10).map(c => ({
            asin: c.asin,
            organicPercentage: c.organicPercentage,
            totalSales: c.totalSales,
          })),
          highAdDependentAsins: highAdDependent.slice(0, 10).map(c => ({
            asin: c.asin,
            organicPercentage: c.organicPercentage,
            totalSales: c.totalSales,
            acos: c.acos,
          })),
          correlations: correlations.slice(0, 50),
          insights: [
            `${highOrganic.length} ASINs are primarily organic (>70% organic sales)`,
            `${highAdDependent.length} ASINs are heavily ad-dependent (<30% organic sales)`,
            `Overall ACoS: ${overallAcos.toFixed(2)}%`,
            `Organic sales represent ${overallOrganicPercentage.toFixed(2)}% of total revenue`,
          ],
        });
      } catch (error) {
        throw new Error(`Failed to correlate reports: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
