import { relations } from 'drizzle-orm';
import {
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
import { customers, shipToAddresses } from '@/features/customers/schema';
import { orders, orderItems } from '@/features/orders/schema';
import { products } from '@/features/products/schema';
import { INVOICE_STATUSES } from './constants';

export const invoiceStatusEnum = pgEnum('invoice_status', INVOICE_STATUSES);

export const invoices = pgTable('invoices', {
    invoiceNumber: varchar('invoice_number', { length: 20 }).primaryKey(),
    orderNumber: varchar('order_number', { length: 20 })
        .notNull()
        .references(() => orders.orderNumber),
    customerNumber: varchar('customer_number', { length: 20 })
        .notNull()
        .references(() => customers.customerNumber),
    salespersonCode: varchar('salesperson_code', { length: 10 })
        .notNull()
        .references(() => users.employeeId),
    invoiceDate: date('invoice_date').notNull(),
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
    invoiceStatus: invoiceStatusEnum('invoice_status')
        .notNull()
        .default('open'),
    dueDate: date('due_date'),
    amountPaid: numeric('amount_paid', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    balanceDue: numeric('balance_due', { precision: 10, scale: 2 }).notNull(),
    paidDate: date('paid_date'),
    paymentRef: varchar('payment_ref', { length: 50 }),
    shippingNote: text('shipping_note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
    order: one(orders, {
        fields: [invoices.orderNumber],
        references: [orders.orderNumber],
    }),
    customer: one(customers, {
        fields: [invoices.customerNumber],
        references: [customers.customerNumber],
    }),
    salesperson: one(users, {
        fields: [invoices.salespersonCode],
        references: [users.employeeId],
    }),
    shipToAddress: one(shipToAddresses, {
        fields: [invoices.shipToId],
        references: [shipToAddresses.shipToId],
    }),
    items: many(orderItems),
    payments: many(payments),
}));

// Payments

export const payments = pgTable('payments', {
    id: serial('id').primaryKey(),
    invoiceNumber: varchar('invoice_number', { length: 20 })
        .notNull()
        .references(() => invoices.invoiceNumber),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    paymentDate: date('payment_date').notNull(),
    paymentRef: varchar('payment_ref', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
    invoice: one(invoices, {
        fields: [payments.invoiceNumber],
        references: [invoices.invoiceNumber],
    }),
}));

// Invoice Items — authoritative billed line items (1 row per invoiced line).
// Sourced from last6MonthInvoiceItems.csv. Distinct from orderItems, which is
// the order lifecycle log and contains duplicated / shadow rows.

export const invoiceItems = pgTable('invoice_items', {
    id: serial('id').primaryKey(),
    invoiceNumber: varchar('invoice_number', { length: 20 })
        .notNull()
        .references(() => invoices.invoiceNumber),
    orderNumber: varchar('order_number', { length: 20 })
        .notNull()
        .references(() => orders.orderNumber),
    itemNumber: varchar('item_number', { length: 50 })
        .notNull()
        .references(() => products.itemNumber),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    qtyOrdered: integer('qty_ordered').notNull().default(0),
    qtyShipped: integer('qty_shipped').notNull().default(0),
    discount: numeric('discount', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    posted: integer('posted').notNull().default(0),
    processed: integer('processed').notNull().default(0),
    unitCost: numeric('unit_cost', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    lineTotal: numeric('line_total', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    legacyIndex: integer('legacy_index'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
    invoice: one(invoices, {
        fields: [invoiceItems.invoiceNumber],
        references: [invoices.invoiceNumber],
    }),
    order: one(orders, {
        fields: [invoiceItems.orderNumber],
        references: [orders.orderNumber],
    }),
    product: one(products, {
        fields: [invoiceItems.itemNumber],
        references: [products.itemNumber],
    }),
}));
