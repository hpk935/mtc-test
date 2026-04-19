import { relations } from 'drizzle-orm';
import {
    boolean,
    jsonb,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';
import { customers } from '@/features/customers/schema';
import { orders } from '@/features/orders/schema';
import { invoices } from '@/features/invoices/schema';
import { USER_ROLES } from './constants';
import type { Permission } from './constants';

export const userRoleEnum = pgEnum('user_role', USER_ROLES);

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    employeeId: varchar('employee_id', { length: 10 }).unique().notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    passwordHash: text('password_hash').notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    role: userRoleEnum('role').notNull().default('employee'),
    permissions: jsonb('permissions')
        .$type<Permission[]>()
        .notNull()
        .default([]),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations

export const usersRelations = relations(users, ({ many }) => ({
    customers: many(customers),
    orders: many(orders),
    invoices: many(invoices),
}));
