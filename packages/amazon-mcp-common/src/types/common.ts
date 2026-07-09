export type AmazonRegion = 'na' | 'eu' | 'fe';

export interface ApiEndpoint {
  region: AmazonRegion;
  url: string;
}

export const ENDPOINTS: Record<string, ApiEndpoint[]> = {
  seller: [
    { region: 'na', url: 'https://sellingpartnerapi-na.amazon.com' },
    { region: 'eu', url: 'https://sellingpartnerapi-eu.amazon.com' },
    { region: 'fe', url: 'https://sellingpartnerapi-fe.amazon.com' },
  ],
  ads: [
    { region: 'na', url: 'https://advertising-api.amazon.com' },
    { region: 'eu', url: 'https://advertising-api-eu.amazon.com' },
    { region: 'fe', url: 'https://advertising-api-fe.amazon.com' },
  ],
};

export const MARKETPLACE_IDS: Record<string, string> = {
  US: 'ATVPDKIKX0DER',
  CA: 'A2EUQ1WTGCTBG2',
  MX: 'A1AM78C64UM0Y8',
  BR: 'A2Q3Y263D00KWC',
  UK: 'A1F83G8C2ARO7P',
  DE: 'A1PA6795UKMFR9',
  FR: 'A13V1IB3VIYBER',
  IT: 'APJ6JRA9NG5V4',
  ES: 'A1RKKUPIHCS9HS',
  NL: 'A1805IZSGTT6HS',
  SE: 'A2NODRKZP88ZB9',
  PL: 'A1C3SOZRARQ6R3',
  BE: 'AMEN7PMS3EDWL',
  JP: 'A1VC38T7YXB528',
  AU: 'A39IBJ37TRP1C6',
  SG: 'A19VAU5U5O7RUS',
  IN: 'A21TJRUUN4KGV',
  AE: 'A2VIGQ35RCS4UG',
  SA: 'A17E79C6D8DWNP',
  EG: 'ARBP9OOSHTCHU',
  TR: 'A33AVAJ2PDY3EV',
};
