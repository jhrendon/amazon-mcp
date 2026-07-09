# Phase 10: FBA Inbound Complete

**Status:** Planned
**Date:** 2026-07-09

Additional FBA Inbound tools to complete the v2024-03-20 API coverage. Phase 4 implemented 5 tools (list/get/create plans, list/get shipments). This phase adds the remaining ~35 operations.

---

## 1. Plan Management (3 tools)

### cancel_inbound_plan

- **Description:** Cancel an inbound plan that has not yet been confirmed.
- **Endpoint:** `PUT /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/cancellation`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |

- **Response:** Operation status

---

### update_inbound_plan_name

- **Description:** Update the name of an inbound plan.
- **Endpoint:** `PUT /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/name`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `name` | `string` | **Yes** | — | New plan name |

- **Response:** Operation status

---

### list_inbound_plan_items

- **Description:** List items in an inbound plan with quantities and prep details.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/items`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `pageSize` | `number` | No | — | Results per page |
| `paginationToken` | `string` | No | — | Pagination token |

- **Response:**
```json
{
  "items": [{
    "msku": "MY-SKU-001",
    "asin": "B08N5WRWNW",
    "fnsku": "X001ABCDEF",
    "quantity": 100,
    "prepOwner": "SELLER",
    "labelOwner": "SELLER"
  }],
  "pagination": { "nextToken": null }
}
```

---

## 2. Packing (5 tools)

### set_packing_information

- **Description:** Set packing information for an inbound plan (boxes and items per box).
- **Endpoint:** `POST /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/packingInformation`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `packageGroupings` | `array` | **Yes** | — | Array of box/item groupings |

- **Response:** Operation status

---

### list_packing_options

- **Description:** List available packing options for an inbound plan.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/packingOptions`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `pageSize` | `number` | No | — | Results per page |
| `paginationToken` | `string` | No | — | Pagination token |

- **Response:** Packing options list

---

### generate_packing_options

- **Description:** Generate packing options based on box contents.
- **Endpoint:** `POST /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/packingOptions`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |

- **Response:** Operation status

---

### confirm_packing_option

- **Description:** Confirm a packing option for the inbound plan.
- **Endpoint:** `POST /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/packingOptions/{packingOptionId}/confirmation`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `packingOptionId` | `string` | **Yes** | — | Packing option ID |

- **Response:** Operation status

---

### list_packing_group_boxes

- **Description:** List boxes in a packing group.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/packingGroups/{packingGroupId}/boxes`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `packingGroupId` | `string` | **Yes** | — | Packing group ID |
| `pageSize` | `number` | No | — | Results per page |
| `paginationToken` | `string` | No | — | Pagination token |

- **Response:** Boxes list

---

## 3. Placement (3 tools)

### list_placement_options

- **Description:** List placement options (which FC to ship to).
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/placementOptions`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `pageSize` | `number` | No | — | Results per page |
| `paginationToken` | `string` | No | — | Pagination token |

- **Response:** Placement options list

---

### generate_placement_options

- **Description:** Generate placement options for the inbound plan.
- **Endpoint:** `POST /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/placementOptions`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |

- **Response:** Operation status

---

### confirm_placement_option

- **Description:** Confirm a placement option (select destination FC).
- **Endpoint:** `POST /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/placementOptions/{placementOptionId}/confirmation`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `placementOptionId` | `string` | **Yes** | — | Placement option ID |

- **Response:** Operation status

---

## 4. Transportation (3 tools)

### list_transportation_options

- **Description:** List transportation options for a shipment.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/shipments/{shipmentId}/transportationOptions`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `shipmentId` | `string` | **Yes** | — | Shipment ID |
| `pageSize` | `number` | No | — | Results per page |
| `paginationToken` | `string` | No | — | Pagination token |

- **Response:** Transportation options list

---

### generate_transportation_options

- **Description:** Generate transportation options (carrier choices).
- **Endpoint:** `POST /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/transportationOptions`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |

- **Response:** Operation status

---

### confirm_transportation_options

- **Description:** Confirm a transportation option (select carrier).
- **Endpoint:** `POST /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/transportationOptions/confirmation`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |

- **Response:** Operation status

---

## 5. Compliance & Prep (4 tools)

### list_prep_details

- **Description:** Get prep requirements for items in the plan.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/items`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `pageSize` | `number` | No | — | Results per page |
| `paginationToken` | `string` | No | — | Pagination token |

- **Response:** Prep details list

---

### set_prep_details

- **Description:** Set prep owner (AMAZON or SELLER) for items.
- **Endpoint:** `POST /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/prepDetails`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |

- **Response:** Operation status

---

### list_item_compliance_details

- **Description:** Get compliance details (FNSKU labels, etc.) for items.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/items`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `pageSize` | `number` | No | — | Results per page |
| `paginationToken` | `string` | No | — | Pagination token |

- **Response:** Compliance details list

---

### update_item_compliance_details

- **Description:** Update compliance details for items.
- **Endpoint:** `PUT /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/itemComplianceDetails`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |

- **Response:** Operation status

---

## 6. Shipment Management (8 tools)

### list_shipment_items

- **Description:** List items in a specific shipment.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/shipments/{shipmentId}/items`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `shipmentId` | `string` | **Yes** | — | Shipment ID |
| `pageSize` | `number` | No | — | Results per page |
| `paginationToken` | `string` | No | — | Pagination token |

- **Response:** Shipment items list

---

### list_shipment_boxes

- **Description:** List boxes in a shipment.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/shipments/{shipmentId}/boxes`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `shipmentId` | `string` | **Yes** | — | Shipment ID |
| `pageSize` | `number` | No | — | Results per page |
| `paginationToken` | `string` | No | — | Pagination token |

- **Response:** Shipment boxes list

---

### list_shipment_pallets

- **Description:** List pallets in a shipment.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/shipments/{shipmentId}/pallets`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `shipmentId` | `string` | **Yes** | — | Shipment ID |
| `pageSize` | `number` | No | — | Results per page |
| `paginationToken` | `string` | No | — | Pagination token |

- **Response:** Shipment pallets list

---

### update_shipment_name

- **Description:** Update the name of a shipment.
- **Endpoint:** `PUT /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/shipments/{shipmentId}/name`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `shipmentId` | `string` | **Yes** | — | Shipment ID |
| `name` | `string` | **Yes** | — | New shipment name |

- **Response:** Operation status

---

### update_shipment_source_address

- **Description:** Update the source address for a shipment.
- **Endpoint:** `PUT /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/shipments/{shipmentId}/sourceAddress`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `shipmentId` | `string` | **Yes** | — | Shipment ID |

- **Response:** Operation status

---

### update_shipment_tracking_details

- **Description:** Update tracking details (PRO number, BOL, etc.).
- **Endpoint:** `PUT /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/shipments/{shipmentId}/trackingDetails`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `shipmentId` | `string` | **Yes** | — | Shipment ID |

- **Response:** Operation status

---

### create_marketplace_item_labels

- **Description:** Generate FNSKU labels for items.
- **Endpoint:** `POST /inbound/fba/2024-03-20/itemLabels`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `marketplaceId` | `string` | No | env `MARKETPLACE_ID` | Marketplace ID |

- **Response:** Label document (PDF)

---

### get_inbound_operation_status

- **Description:** Get the status of an async inbound operation.
- **Endpoint:** `GET /inbound/fba/2024-03-20/operations/{operationId}`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `operationId` | `string` | **Yes** | — | Operation ID |

- **Response:** Operation status

---

## 7. Delivery Windows (3 tools)

### list_delivery_window_options

- **Description:** List available delivery window options for a shipment.
- **Endpoint:** `GET /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/shipments/{shipmentId}/deliveryWindowOptions`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `shipmentId` | `string` | **Yes** | — | Shipment ID |
| `pageSize` | `number` | No | — | Results per page |
| `paginationToken` | `string` | No | — | Pagination token |

- **Response:** Delivery window options list

---

### generate_delivery_window_options

- **Description:** Generate delivery window options.
- **Endpoint:** `POST /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/shipments/{shipmentId}/deliveryWindowOptions`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `shipmentId` | `string` | **Yes** | — | Shipment ID |

- **Response:** Operation status

---

### confirm_delivery_window_options

- **Description:** Confirm a delivery window option.
- **Endpoint:** `POST /inbound/fba/2024-03-20/inboundPlans/{inboundPlanId}/shipments/{shipmentId}/deliveryWindowOptions/{deliveryWindowOptionId}/confirmation`
- **Rate Limit Category:** `fbaInbound`
- **Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inboundPlanId` | `string` | **Yes** | — | FBA inbound plan ID |
| `shipmentId` | `string` | **Yes** | — | Shipment ID |
| `deliveryWindowOptionId` | `string` | **Yes** | — | Delivery window option ID |

- **Response:** Operation status

---

## Architecture

### Workflow

1. `create_inbound_plan` → get plan ID
2. `set_packing_information` or `generate_packing_options` → `confirm_packing_option`
3. `generate_placement_options` → `confirm_placement_option`
4. `generate_transportation_options` → `confirm_transportation_options`
5. `generate_delivery_window_options` → `confirm_delivery_window_options`
6. Ship to FC, update tracking

### Rate Limiting

| Category | Requests/s | Burst |
|---|---|---|
| `fbaInbound` | 2 | 30 |

---

## Next Steps

- Phase 11: Fulfillment Outbound (MCF)
