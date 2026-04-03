import { ilike, or, and, count, asc, eq, sql } from 'drizzle-orm';
import db from '@/lib/db';
import { customers, shipToAddresses } from './schema';
import { users } from '@/features/users/schema';
import type { AccountStatus } from './constants';

const PAGE_SIZE_DEFAULT = 20;

export async function getCustomers({
    search,
    status,
    page = 1,
    pageSize = PAGE_SIZE_DEFAULT,
}: {
    search?: string;
    status?: AccountStatus;
    page?: number;
    pageSize?: number;
} = {}) {
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (status) {
        conditions.push(eq(customers.accountStatus, status));
    }

    if (search) {
        conditions.push(
            or(
                ilike(customers.customerName, `%${search}%`),
                ilike(customers.customerNumber, `%${search}%`),
                ilike(customers.billingPostalCode, `%${search}%`),
                ilike(customers.primaryContactName, `%${search}%`),
            )!,
        );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
        db
            .select({
                customerNumber: customers.customerNumber,
                customerName: customers.customerName,
                primaryContactName: customers.primaryContactName,
                mainEmail: customers.mainEmail,
                mainPhone: customers.mainPhone,
                billingCity: customers.billingCity,
                billingStateCode: customers.billingStateCode,
                accountStatus: customers.accountStatus,
            })
            .from(customers)
            .where(whereClause)
            .orderBy(asc(customers.customerName))
            .limit(pageSize)
            .offset(offset),
        db.select({ total: count() }).from(customers).where(whereClause),
    ]);

    return {
        customers: data,
        totalCount: total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

export type CustomerListItem = Awaited<
    ReturnType<typeof getCustomers>
>['customers'][number];

export async function getSalespersons() {
    return db
        .select({
            employeeId: users.employeeId,
            firstName: users.firstName,
            lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.isActive, true))
        .orderBy(asc(users.lastName), asc(users.firstName));
}

export async function findCustomerByNumber(customerNumber: string) {
    const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.customerNumber, customerNumber))
        .limit(1);
    return customer ?? null;
}

export async function getShipToAddresses(
    customerNumber: string,
    options?: {
        search?: string;
        limit?: number;
        offset?: number;
        favoritesOnly?: boolean;
    },
) {
    const conditions = [eq(shipToAddresses.customerNumber, customerNumber)];

    if (options?.search && options.search.trim().length > 0) {
        const term = `%${options.search.trim()}%`;
        conditions.push(
            or(
                ilike(shipToAddresses.locationName, term),
                ilike(shipToAddresses.address1, term),
                ilike(shipToAddresses.city, term),
                ilike(shipToAddresses.stateCode, term),
                ilike(shipToAddresses.postalCode, term),
            )!,
        );
    }

    if (options?.favoritesOnly) {
        conditions.push(eq(shipToAddresses.isFavorite, true));
    }

    const where = and(...conditions);

    let query = db
        .select()
        .from(shipToAddresses)
        .where(where)
        .orderBy(
            sql`${shipToAddresses.isFavorite} desc`,
            asc(shipToAddresses.locationName),
        );

    if (options?.limit) {
        query = query.limit(options.limit) as typeof query;
    }
    if (options?.offset) {
        query = query.offset(options.offset) as typeof query;
    }

    const [rows, [countResult]] = await Promise.all([
        query,
        db.select({ total: count() }).from(shipToAddresses).where(where),
    ]);

    return { rows, filteredTotal: countResult?.total ?? 0 };
}

export async function countShipToAddresses(
    customerNumber: string,
): Promise<number> {
    const [result] = await db
        .select({ total: count() })
        .from(shipToAddresses)
        .where(eq(shipToAddresses.customerNumber, customerNumber));
    return result?.total ?? 0;
}

export async function findShipToAddress(shipToId: string) {
    const [address] = await db
        .select()
        .from(shipToAddresses)
        .where(eq(shipToAddresses.shipToId, shipToId))
        .limit(1);
    return address ?? null;
}

export async function getMaxNumericCustomerNumber(): Promise<number> {
    const [result] = await db
        .select({
            maxNum: sql<number>`max(cast(${customers.customerNumber} as integer))`,
        })
        .from(customers)
        .where(sql`${customers.customerNumber} ~ '^[0-9]+$'`);
    return result?.maxNum ?? 0;
}

export async function getMaxShipToId(): Promise<number> {
    const [result] = await db
        .select({
            maxNum: sql<number>`max(cast(substring(${shipToAddresses.shipToId} from 3) as integer))`,
        })
        .from(shipToAddresses)
        .where(sql`${shipToAddresses.shipToId} ~ '^ST[0-9]+$'`);
    return result?.maxNum ?? 0;
}
