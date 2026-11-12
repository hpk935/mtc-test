import { relations } from 'drizzle-orm';
import {
    boolean,
    date,
    integer,
    numeric,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';
import { users } from '@/features/users/schema';
import { products } from '@/features/products/schema';
import { PO_STATUSES, VENDOR_TYPES } from './constants';

export const vendorTypeEnum = pgEnum('vendor_type', VENDOR_TYPES);
export const purchaseOrderStatusEnum = pgEnum(
    'purchase_order_status',
    PO_STATUSES,
);

export const vendors = pgTable('vendors', {
    id: serial('id').primaryKey(),
    vendorCode: varchar('vendor_code', { length: 10 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    address1: varchar('address_1', { length: 255 }),
    address2: varchar('address_2', { length: 255 }),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 10 }),
    zip: varchar('zip', { length: 20 }),
    phone: varchar('phone', { length: 20 }),
    fax: varchar('fax', { length: 20 }),
    accountNumber: varchar('account_number', { length: 50 }),
    contactName: varchar('contact_name', { length: 100 }),
    taxId: varchar('tax_id', { length: 20 }),
    send1099: boolean('send_1099').notNull().default(false),
    vendorType: vendorTypeEnum('vendor_type').notNull().default('CS'),
    paymentTerms: varchar('payment_terms', { length: 10 }),
    glAccountCode: varchar('gl_account_code', { length: 10 }),
    dateAdded: date('date_added'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vendorsRelations = relations(vendors, ({ many }) => ({
    purchaseOrders: many(purchaseOrders),
}));

export const purchaseOrders = pgTable('purchase_orders', {
    id: serial('id').primaryKey(),
    poNumber: varchar('po_number', { length: 20 }).notNull().unique(),
    vendorId: integer('vendor_id')
        .notNull()
        .references(() => vendors.id),
    status: purchaseOrderStatusEnum('status').notNull().default('draft'),
    orderDate: date('order_date').notNull(),
    expectedDate: date('expected_date'),
    receivedDate: date('received_date'),
    subtotalAmount: numeric('subtotal_amount', { precision: 12, scale: 2 })
        .notNull()
        .default('0'),
    freightAmount: numeric('freight_amount', { precision: 12, scale: 2 })
        .notNull()
        .default('0'),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 })
        .notNull()
        .default('0'),
    notes: text('notes'),
    // Shipping details, known after the order is placed; editable in any
    // status and printed on the PO.
    vessel: varchar('vessel', { length: 100 }),
    vendorInvoiceNumber: varchar('vendor_invoice_number', { length: 50 }),
    createdBy: varchar('created_by', { length: 10 }).references(
        () => users.employeeId,
    ),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const purchaseOrdersRelations = relations(
    purchaseOrders,
    ({ one, many }) => ({
        vendor: one(vendors, {
            fields: [purchaseOrders.vendorId],
            references: [vendors.id],
        }),
        creator: one(users, {
            fields: [purchaseOrders.createdBy],
            references: [users.employeeId],
        }),
        items: many(purchaseOrderItems),
    }),
);

export const purchaseOrderItems = pgTable('purchase_order_items', {
    id: serial('id').primaryKey(),
    purchaseOrderId: integer('purchase_order_id')
        .notNull()
        .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
        .notNull()
        .references(() => products.productId),
    itemNumber: varchar('item_number', { length: 50 }).notNull(),
    description: varchar('description', { length: 500 }).notNull(),
    qtyOrdered: integer('qty_ordered').notNull(),
    qtyReceived: integer('qty_received').notNull().default(0),
    unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull(),
    lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const purchaseOrderItemsRelations = relations(
    purchaseOrderItems,
    ({ one }) => ({
        purchaseOrder: one(purchaseOrders, {
            fields: [purchaseOrderItems.purchaseOrderId],
            references: [purchaseOrders.id],
        }),
        product: one(products, {
            fields: [purchaseOrderItems.productId],
            references: [products.productId],
        }),
    }),
);
