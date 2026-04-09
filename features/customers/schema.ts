import { relations } from 'drizzle-orm';
import {
    boolean,
    date,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';
import { users } from '@/features/users/schema';
import { orders } from '@/features/orders/schema';
import { invoices } from '@/features/invoices/schema';
import { ACCOUNT_STATUSES, LOCATION_STATUSES } from './constants';

export const accountStatusEnum = pgEnum('account_status', ACCOUNT_STATUSES);
export const locationStatusEnum = pgEnum('location_status', LOCATION_STATUSES);

export const customers = pgTable('customers', {
    customerNumber: varchar('customer_number', { length: 20 }).primaryKey(),
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    primaryContactName: varchar('primary_contact_name', {
        length: 255,
    }).notNull(),
    billingAddress1: varchar('billing_address_1', { length: 255 }).notNull(),
    billingAddress2: varchar('billing_address_2', { length: 255 }),
    billingCity: varchar('billing_city', { length: 100 }).notNull(),
    billingStateCode: varchar('billing_state_code', { length: 10 }).notNull(),
    billingPostalCode: varchar('billing_postal_code', { length: 20 }).notNull(),
    countryCode: varchar('country_code', { length: 5 }).notNull().default('US'),
    mainPhone: varchar('main_phone', { length: 20 }).notNull(),
    phoneExtension: varchar('phone_extension', { length: 10 }),
    faxNumber: varchar('fax_number', { length: 20 }),
    mainEmail: varchar('main_email', { length: 255 }).notNull(),
    taxId: varchar('tax_id', { length: 20 }),
    termCode: varchar('term_code', { length: 10 }).notNull(),
    territoryCode: varchar('territory_code', { length: 20 }).notNull(),
    salespersonCode: varchar('salesperson_code', { length: 10 })
        .notNull()
        .references(() => users.employeeId),
    defaultFreightTerm: varchar('default_freight_term', {
        length: 50,
    }).notNull(),
    creditBalance: numeric('credit_balance', { precision: 10, scale: 2 })
        .notNull()
        .default('0'),
    accountStatus: accountStatusEnum('account_status')
        .notNull()
        .default('active'),
    accountOpenDate: date('account_open_date').notNull(),
    lastInvoiceDate: date('last_invoice_date'),
    customerNote: text('customer_note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const shipToAddresses = pgTable('ship_to_addresses', {
    shipToId: varchar('ship_to_id', { length: 20 }).primaryKey(),
    customerNumber: varchar('customer_number', { length: 20 })
        .notNull()
        .references(() => customers.customerNumber),
    locationName: varchar('location_name', { length: 255 }).notNull(),
    locationStatus: locationStatusEnum('location_status')
        .notNull()
        .default('active'),
    address1: varchar('address_1', { length: 255 }).notNull(),
    address2: varchar('address_2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    stateCode: varchar('state_code', { length: 10 }).notNull(),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    countryCode: varchar('country_code', { length: 5 }).notNull().default('US'),
    contactName: varchar('contact_name', { length: 255 }),
    mainPhone: varchar('main_phone', { length: 20 }),
    isFavorite: boolean('is_favorite').notNull().default(false),
    customerNote: text('customer_note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations

export const customersRelations = relations(customers, ({ one, many }) => ({
    salesperson: one(users, {
        fields: [customers.salespersonCode],
        references: [users.employeeId],
    }),
    shipToAddresses: many(shipToAddresses),
    orders: many(orders),
    invoices: many(invoices),
}));

export const shipToAddressesRelations = relations(
    shipToAddresses,
    ({ one }) => ({
        customer: one(customers, {
            fields: [shipToAddresses.customerNumber],
            references: [customers.customerNumber],
        }),
    }),
);
