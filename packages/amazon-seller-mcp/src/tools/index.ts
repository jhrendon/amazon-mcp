import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerOrderTools } from './orders.js';
import { registerInventoryTools } from './inventory.js';
import { registerSalesTools } from './sales.js';
import { registerCatalogTools } from './catalog.js';
import { registerFinanceTools } from './finances.js';
import { registerInvoicesTools } from './invoices.js';
import { registerFeesTools } from './fees.js';
import { registerFeedbackTools } from './feedback.js';
import { registerListingsTools } from './listings.js';
import { registerPricingTools } from './pricing.js';
import { registerSolicitationsTools } from './solicitations.js';
import { registerFBAInboundTools } from './fba-inbound.js';
import { registerTokensTools } from './tokens.js';
import { registerMerchantFulfillmentTools } from './merchant-fulfillment.js';
import { registerDataKioskTools } from './data-kiosk.js';
import { registerFeedsTools } from './feeds.js';
import { registerNotificationsTools } from './notifications.js';
import { registerAllReportTools } from './reports/index.js';
import { registerFulfillmentOutboundTools } from './fulfillment-outbound.js';
import { registerPricingV0Tools } from './pricing-v0.js';
import { registerProductTypeDefinitionTools } from './product-type-definitions.js';
import { registerListingsRestrictionsTools } from './listings-restrictions.js';
import { registerSellersTools } from './sellers.js';
import { registerAplusContentTools } from './aplus-content.js';

export function registerAllTools(server: McpServer): void {
  registerOrderTools(server);
  registerInventoryTools(server);
  registerSalesTools(server);
  registerCatalogTools(server);
  registerFinanceTools(server);
  registerInvoicesTools(server);
  registerFeesTools(server);
  registerFeedbackTools(server);
  registerListingsTools(server);
  registerPricingTools(server);
  registerSolicitationsTools(server);
  registerFBAInboundTools(server);
  registerTokensTools(server);
  registerMerchantFulfillmentTools(server);
  registerDataKioskTools(server);
  registerFeedsTools(server);
  registerNotificationsTools(server);
  registerAllReportTools(server);
  registerFulfillmentOutboundTools(server);
  registerPricingV0Tools(server);
  registerProductTypeDefinitionTools(server);
  registerListingsRestrictionsTools(server);
  registerSellersTools(server);
  registerAplusContentTools(server);
}

export {
  registerOrderTools,
  registerInventoryTools,
  registerSalesTools,
  registerCatalogTools,
  registerFinanceTools,
  registerInvoicesTools,
  registerFeesTools,
  registerFeedbackTools,
  registerListingsTools,
  registerPricingTools,
  registerSolicitationsTools,
  registerFBAInboundTools,
  registerTokensTools,
  registerMerchantFulfillmentTools,
  registerDataKioskTools,
  registerFeedsTools,
  registerNotificationsTools,
  registerAllReportTools,
  registerFulfillmentOutboundTools,
  registerPricingV0Tools,
  registerProductTypeDefinitionTools,
  registerListingsRestrictionsTools,
  registerSellersTools,
  registerAplusContentTools,
};
