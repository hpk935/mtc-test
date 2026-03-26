import { ilike, or, count, asc, eq } from 'drizzle-orm';
import db from '@/lib/db';
import { customers, shipToAddresses } from './schema';
import { users } from '@/features/users/schema';

const PAGE_SIZE_DEFAULT = 20;

export async function getCustomers({
    search,
    page = 1,
    pageSize = PAGE_SIZE_DEFAULT,
}: {
    search?: string;
    page?: number;
    pageSize?: number;
} = {}) {
    const offset = (page - 1) * pageSize;

    const whereClause = search
        ? or(
              ilike(customers.customerName, `%${search}%`),
              ilike(customers.mainEmail, `%${search}%`),
          )
        : undefined;

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

export async function getShipToAddresses(customerNumber: string) {
    return db
        .select()
        .from(shipToAddresses)
        .where(eq(shipToAddresses.customerNumber, customerNumber))
        .orderBy(asc(shipToAddresses.locationName));
}

export async function findShipToAddress(shipToId: string) {
    const [address] = await db
        .select()
        .from(shipToAddresses)
        .where(eq(shipToAddresses.shipToId, shipToId))
        .limit(1);
    return address ?? null;
}
