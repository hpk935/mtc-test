import { sql } from 'drizzle-orm';
import {
    boolean,
    check,
    integer,
    pgTable,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';

export const terms = pgTable(
    'terms',
    {
        code: varchar('code', { length: 10 }).primaryKey(),
        description: varchar('description', { length: 255 }).notNull(),
        netDays: integer('net_days'),
        isActive: boolean('is_active').notNull().default(true),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => [
        // Inactive legacy terms may have an unknown meaning; anything staff can
        // still select must be able to produce a due date.
        check(
            'terms_active_has_net_days',
            sql`${table.isActive} = false OR ${table.netDays} IS NOT NULL`,
        ),
        check(
            'terms_net_days_not_negative',
            sql`${table.netDays} IS NULL OR ${table.netDays} >= 0`,
        ),
    ],
);

export const territories = pgTable('territories', {
    code: varchar('code', { length: 20 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Orders, invoices and customers store the freight term code as plain text with
// no foreign key, because a blank freight term is allowed there.
export const freightTerms = pgTable('freight_terms', {
    code: varchar('code', { length: 50 }).primaryKey(),
    description: varchar('description', { length: 255 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
