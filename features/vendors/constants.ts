export const VENDOR_TYPES = ['CS', 'CO'] as const;
export type VendorType = (typeof VENDOR_TYPES)[number];

export const VENDOR_TYPE_LABEL: Record<VendorType, string> = {
    CS: 'Cost of Sales',
    CO: 'Overhead / Other',
};

export const PO_STATUSES = [
    'draft',
    'ordered',
    'partially_received',
    'received',
    'cancelled',
] as const;
export type PurchaseOrderStatus = (typeof PO_STATUSES)[number];

export const PO_STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
    draft: 'Draft',
    ordered: 'Ordered',
    partially_received: 'Partially Received',
    received: 'Received',
    cancelled: 'Cancelled',
};
