import type { vendors, purchaseOrders, purchaseOrderItems } from './schema';

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

export type PurchaseOrderWithItems = PurchaseOrder & {
    vendor: Pick<Vendor, 'id' | 'vendorCode' | 'name'>;
    items: PurchaseOrderItem[];
};
