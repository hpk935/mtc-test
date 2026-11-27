import { eq, sql } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import db from '@/lib/db';
import { customers } from '@/features/customers/schema';
import { orders } from '@/features/orders/schema';
import { invoices } from '@/features/invoices/schema';
import { freightTerms, terms, territories } from './schema';
import type { ReferenceCodeKind } from './constants';
import type { ReferenceCodeRecord, ReferenceCodeValues } from './types';

interface ReferenceCodeStore {
    all(): Promise<ReferenceCodeRecord[]>;
    find(code: string): Promise<ReferenceCodeRecord | null>;
    /** The stored spelling of a code that matches ignoring case, if any. */
    findSpelling(code: string): Promise<string | null>;
    insert(code: string, values: ReferenceCodeValues): Promise<void>;
    update(code: string, values: ReferenceCodeValues): Promise<void>;
    remove(code: string): Promise<void>;
    /** Does any customer, order or invoice hold this code? */
    isInUse(code: string): Promise<boolean>;
}

async function isHeldBy(columns: PgColumn[], code: string): Promise<boolean> {
    for (const column of columns) {
        const [row] = await db
            .select({ found: sql<number>`1` })
            .from(column.table)
            .where(eq(column, code))
            .limit(1);
        if (row) return true;
    }
    return false;
}

async function findSpelling(
    table: typeof terms | typeof territories | typeof freightTerms,
    code: string,
): Promise<string | null> {
    const [row] = await db
        .select({ code: table.code })
        .from(table)
        .where(sql`lower(${table.code}) = lower(${code})`)
        .limit(1);
    return row?.code ?? null;
}

const termStore: ReferenceCodeStore = {
    async all() {
        return db.select().from(terms);
    },
    async find(code) {
        const [row] = await db.select().from(terms).where(eq(terms.code, code));
        return row ?? null;
    },
    findSpelling: (code) => findSpelling(terms, code),
    async insert(code, values) {
        await db.insert(terms).values({ code, ...values });
    },
    async update(code, values) {
        await db
            .update(terms)
            .set({ ...values, updatedAt: new Date() })
            .where(eq(terms.code, code));
    },
    async remove(code) {
        await db.delete(terms).where(eq(terms.code, code));
    },
    isInUse: (code) =>
        isHeldBy(
            [customers.termCode, orders.termCode, invoices.termCode],
            code,
        ),
};

function fromTerritory(
    row: typeof territories.$inferSelect,
): ReferenceCodeRecord {
    const { name, ...rest } = row;
    return { ...rest, description: name, netDays: null };
}

const territoryStore: ReferenceCodeStore = {
    async all() {
        return (await db.select().from(territories)).map(fromTerritory);
    },
    async find(code) {
        const [row] = await db
            .select()
            .from(territories)
            .where(eq(territories.code, code));
        return row ? fromTerritory(row) : null;
    },
    findSpelling: (code) => findSpelling(territories, code),
    async insert(code, { description, isActive }) {
        await db
            .insert(territories)
            .values({ code, name: description, isActive });
    },
    async update(code, { description, isActive }) {
        await db
            .update(territories)
            .set({ name: description, isActive, updatedAt: new Date() })
            .where(eq(territories.code, code));
    },
    async remove(code) {
        await db.delete(territories).where(eq(territories.code, code));
    },
    isInUse: (code) =>
        isHeldBy(
            [
                customers.territoryCode,
                orders.territoryCode,
                invoices.territoryCode,
            ],
            code,
        ),
};

const freightTermStore: ReferenceCodeStore = {
    async all() {
        return (await db.select().from(freightTerms)).map((row) => ({
            ...row,
            netDays: null,
        }));
    },
    async find(code) {
        const [row] = await db
            .select()
            .from(freightTerms)
            .where(eq(freightTerms.code, code));
        return row ? { ...row, netDays: null } : null;
    },
    findSpelling: (code) => findSpelling(freightTerms, code),
    async insert(code, { description, isActive }) {
        await db.insert(freightTerms).values({ code, description, isActive });
    },
    async update(code, { description, isActive }) {
        await db
            .update(freightTerms)
            .set({ description, isActive, updatedAt: new Date() })
            .where(eq(freightTerms.code, code));
    },
    async remove(code) {
        await db.delete(freightTerms).where(eq(freightTerms.code, code));
    },
    isInUse: (code) =>
        isHeldBy(
            [
                customers.defaultFreightTerm,
                orders.freightTerm,
                invoices.freightTerm,
            ],
            code,
        ),
};

export const referenceCodeStores: Record<
    ReferenceCodeKind,
    ReferenceCodeStore
> = {
    term: termStore,
    territory: territoryStore,
    freightTerm: freightTermStore,
};
