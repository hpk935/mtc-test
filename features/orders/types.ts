import type { orders } from './schema';

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
