import { TokenManager } from 'amazon-mcp-common';
import { getConfig } from '../config/index.js';

let tokenManagerInstance: TokenManager | null = null;

export function getTokenManager(): TokenManager {
  if (!tokenManagerInstance) {
    const config = getConfig();
    tokenManagerInstance = new TokenManager({
      clientId: config.LWA_CLIENT_ID,
      clientSecret: config.LWA_CLIENT_SECRET,
      refreshToken: config.ADS_REFRESH_TOKEN,
      scope: 'advertising::campaign_management',
    });
  }
  return tokenManagerInstance;
}

export { TokenManager };
