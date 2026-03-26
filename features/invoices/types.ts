import type { invoices, accountReceivables } from './schema';

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type AccountReceivable = typeof accountReceivables.$inferSelect;
export type NewAccountReceivable = typeof accountReceivables.$inferInsert;
