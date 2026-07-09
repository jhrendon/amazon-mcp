import { z } from 'zod';

export const moneySchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid money amount'),
  currencyCode: z.string().length(3, 'Currency code must be 3 characters'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date (YYYY-MM-DD)'),
});

export const paginationSchema = z.object({
  pageSize: z.number().int().positive().max(1000).optional(),
  nextToken: z.string().optional(),
});
