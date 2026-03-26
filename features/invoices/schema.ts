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
import { orders } from '@/features/orders/schema';
import { INVOICE_STATUSES, PAYMENT_STATUSES } from './constants';

export const invoiceStatusEnum = pgEnum('invoice_status', INVOICE_STATUSES);
export const paymentStatusEnum = pgEnum('payment_status', PAYMENT_STATUSES);

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
    shippingNote: text('shipping_note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accountReceivables = pgTable('account_receivables', {
    invoiceNumber: varchar('invoice_number', { length: 20 })
        .primaryKey()
        .references(() => invoices.invoiceNumber),
    orderNumber: varchar('order_number', { length: 20 })
        .notNull()
        .references(() => orders.orderNumber),
    customerNumber: varchar('customer_number', { length: 20 })
        .notNull()
        .references(() => customers.customerNumber),
    receivableDate: date('receivable_date').notNull(),
    dueDate: date('due_date').notNull(),
    termCode: varchar('term_code', { length: 10 }).notNull(),
    invoiceTotalAmount: numeric('invoice_total_amount', {
        precision: 10,
        scale: 2,
    }).notNull(),
    amountPaid: numeric('amount_paid', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    balanceDue: numeric('balance_due', { precision: 10, scale: 2 }).notNull(),
    paymentStatus: paymentStatusEnum('payment_status')
        .notNull()
        .default('open'),
    paidDate: date('paid_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations

export const invoicesRelations = relations(invoices, ({ one }) => ({
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
    accountReceivable: one(accountReceivables, {
        fields: [invoices.invoiceNumber],
        references: [accountReceivables.invoiceNumber],
    }),
}));

export const accountReceivablesRelations = relations(
    accountReceivables,
    ({ one }) => ({
        invoice: one(invoices, {
            fields: [accountReceivables.invoiceNumber],
            references: [invoices.invoiceNumber],
        }),
        order: one(orders, {
            fields: [accountReceivables.orderNumber],
            references: [orders.orderNumber],
        }),
        customer: one(customers, {
            fields: [accountReceivables.customerNumber],
            references: [customers.customerNumber],
        }),
    }),
);
