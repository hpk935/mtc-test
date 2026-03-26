import { relations } from 'drizzle-orm';
import {
    date,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';
import { users } from '@/features/users/schema';
import { customers, shipToAddresses } from '@/features/customers/schema';
import { invoices } from '@/features/invoices/schema';
import { ORDER_STATUSES } from './constants';

export const orderStatusEnum = pgEnum('order_status', ORDER_STATUSES);

export const orders = pgTable('orders', {
    orderNumber: varchar('order_number', { length: 20 }).primaryKey(),
    customerNumber: varchar('customer_number', { length: 20 })
        .notNull()
        .references(() => customers.customerNumber),
    salespersonCode: varchar('salesperson_code', { length: 10 })
        .notNull()
        .references(() => users.employeeId),
    orderDate: date('order_date').notNull(),
    customerPoReference: varchar('customer_po_reference', { length: 50 }),
    freightTerm: varchar('freight_term', { length: 50 }).notNull(),
    shipToId: varchar('ship_to_id', { length: 20 })
        .notNull()
        .references(() => shipToAddresses.shipToId),
    shipToName: varchar('ship_to_name', { length: 255 }).notNull(),
    shipToAddress1: varchar('ship_to_address_1', { length: 255 }).notNull(),
    shipToAddress2: varchar('ship_to_address_2', { length: 255 }),
    shipToCity: varchar('ship_to_city', { length: 100 }).notNull(),
    shipToStateCode: varchar('ship_to_state_code', { length: 10 }).notNull(),
    shipToPostalCode: varchar('ship_to_postal_code', { length: 20 }).notNull(),
    termCode: varchar('term_code', { length: 10 }).notNull(),
    territoryCode: varchar('territory_code', { length: 20 }).notNull(),
    salesTaxAmount: numeric('sales_tax_amount', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    subtotalAmount: numeric('subtotal_amount', {
        precision: 10,
        scale: 2,
    }).notNull(),
    freightAmount: numeric('freight_amount', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    costAmount: numeric('cost_amount', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    orderStatus: orderStatusEnum('order_status').notNull().default('open'),
    shippingNote: text('shipping_note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations

export const ordersRelations = relations(orders, ({ one, many }) => ({
    customer: one(customers, {
        fields: [orders.customerNumber],
        references: [customers.customerNumber],
    }),
    salesperson: one(users, {
        fields: [orders.salespersonCode],
        references: [users.employeeId],
    }),
    shipToAddress: one(shipToAddresses, {
        fields: [orders.shipToId],
        references: [shipToAddresses.shipToId],
    }),
    invoices: many(invoices),
}));
