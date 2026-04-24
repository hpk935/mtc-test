import { relations } from 'drizzle-orm';
import {
    boolean,
    integer,
    numeric,
    pgTable,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';
import { orderItems } from '@/features/orders/schema';
import { purchaseOrderItems } from '@/features/vendors/schema';

export const products = pgTable('products', {
    productId: integer('product_id').primaryKey(),
    itemNumber: varchar('item_number', { length: 50 }).notNull().unique(),
    description: varchar('description', { length: 500 }).notNull(),
    cartonNumber: varchar('carton_number', { length: 50 }),
    unitSoldBy: varchar('unit_sold_by', { length: 10 }).notNull(),
    minQty: integer('min_qty').notNull().default(0),
    maxQty: integer('max_qty').notNull().default(0),
    productType: varchar('product_type', { length: 10 }).notNull(),
    dimensionsL: numeric('dimensions_l', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    dimensionsW: numeric('dimensions_w', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    dimensionsH: numeric('dimensions_h', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    cubicFeet: numeric('cubic_feet', { precision: 10, scale: 4 })
        .notNull()
        .default('0'),
    caseWeight: numeric('case_weight', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    upcNumber: varchar('upc_number', { length: 50 }),
    landedCost: numeric('landed_cost', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    minimumPackPrice: numeric('minimum_pack_price', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    casePrice: numeric('case_price', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    qtyInStock: integer('qty_in_stock').notNull().default(0),
    qtyCommitted: integer('qty_committed').notNull().default(0),
    qtyAvailable: integer('qty_available').notNull().default(0),
    qtyOnOrder: integer('qty_on_order').notNull().default(0),
    nob: integer('nob'),
    isDiscontinued: boolean('is_discontinued').notNull().default(false),
    htsCode: varchar('hts_code', { length: 20 }),
    leadTime: varchar('lead_time', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ many }) => ({
    orderItems: many(orderItems),
    purchaseOrderItems: many(purchaseOrderItems),
}));
