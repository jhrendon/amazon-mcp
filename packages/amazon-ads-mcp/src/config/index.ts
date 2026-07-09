import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  LWA_CLIENT_ID: z.string().min(1, 'LWA_CLIENT_ID is required'),
  LWA_CLIENT_SECRET: z.string().min(1, 'LWA_CLIENT_SECRET is required'),
  ADS_REFRESH_TOKEN: z.string().min(1, 'ADS_REFRESH_TOKEN is required'),
  ADS_PROFILE_ID: z.string().min(1, 'ADS_PROFILE_ID is required'),
  ADS_API_REGION: z.enum(['na', 'eu', 'fe']).default('na'),
  ADS_API_ENDPOINT: z.string().url().optional(),
});

export type AdsConfig = z.infer<typeof configSchema>;

let cachedConfig: AdsConfig | null = null;

export function validateConfig(): AdsConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`);
    throw new Error(
      `Configuration validation failed:\n${errors.join('\n')}\n\n` +
        'Please ensure all required environment variables are set.\n' +
        'See .env.example for reference.'
    );
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function getConfig(): AdsConfig {
  if (!cachedConfig) {
    return validateConfig();
  }
  return cachedConfig;
}

export const ADS_API_ENDPOINTS = {
  na: 'https://advertising-api.amazon.com',
  eu: 'https://advertising-api-eu.amazon.com',
  fe: 'https://advertising-api-fe.amazon.com',
} as const;

export function getAdsApiEndpoint(region: 'na' | 'eu' | 'fe', override?: string): string {
  return override ?? ADS_API_ENDPOINTS[region];
}
