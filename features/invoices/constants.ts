export const INVOICE_STATUSES = [
    'open',
    'paid',
    'partially_paid',
    'voided',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
