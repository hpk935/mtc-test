import { ilike, or, count, asc } from 'drizzle-orm';
import db from '@/lib/db';
import { customers } from './schema';

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
