export const ORDER_STATUSES = ['open', 'invoiced', 'voided'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
