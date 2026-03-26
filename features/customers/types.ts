import type { customers, shipToAddresses } from './schema';

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type ShipToAddress = typeof shipToAddresses.$inferSelect;
export type NewShipToAddress = typeof shipToAddresses.$inferInsert;
