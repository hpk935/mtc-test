export const INVOICE_STATUSES = ['posted', 'paid', 'voided'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_STATUSES = [
    'open',
    'paid',
    'partially_paid',
    'voided',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
