import {
    and,
    asc,
    count,
    countDistinct,
    desc,
    eq,
    gte,
    ilike,
    lte,
    ne,
    or,
    sql,
} from 'drizzle-orm';
import db from '@/lib/db';
import { todayIso } from '@/lib/dates';
import { customers } from '@/features/customers/schema';
import { invoices, invoiceItems, payments } from '@/features/invoices/schema';
import { products } from '@/features/products/schema';
import { users } from '@/features/users/schema';
import type { AccountStatus } from '@/features/customers/constants';
import type { InvoiceStatus } from '@/features/invoices/constants';
import { getMtdRange, getPeriodRange, getYtdRange } from '../service';

// -----------------------------------------------------------------------------
// Shared filter helpers
// -----------------------------------------------------------------------------

export async function getDistinctTerritories(): Promise<string[]> {
    const rows = await db
        .selectDistinct({ code: customers.territoryCode })
        .from(customers)
        .orderBy(asc(customers.territoryCode));
    return rows.map((r) => r.code).filter(Boolean);
}

export async function getActiveSalespersons() {
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

// -----------------------------------------------------------------------------
// 1. Customer Name Listing
// -----------------------------------------------------------------------------

export type CustomerListingFilters = {
    search?: string;
    salesperson?: string;
    territory?: string;
    status?: AccountStatus | 'all';
    page?: number;
    pageSize?: number;
};

const LISTING_PAGE_SIZE = 50;

function buildListingWhere(filters: CustomerListingFilters) {
    const conditions = [];

    if (filters.status && filters.status !== 'all') {
        conditions.push(eq(customers.accountStatus, filters.status));
    }
    if (filters.salesperson) {
        conditions.push(eq(customers.salespersonCode, filters.salesperson));
    }
    if (filters.territory) {
        conditions.push(eq(customers.territoryCode, filters.territory));
    }
    if (filters.search) {
        const term = `%${filters.search.trim()}%`;
        conditions.push(
            or(
                ilike(customers.customerName, term),
                ilike(customers.customerNumber, term),
                ilike(customers.primaryContactName, term),
                ilike(customers.mainEmail, term),
            )!,
        );
    }

    return conditions.length ? and(...conditions) : undefined;
}

export async function getCustomerListingReport(
    filters: CustomerListingFilters,
) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = filters.pageSize ?? LISTING_PAGE_SIZE;
    const offset = (page - 1) * pageSize;
    const where = buildListingWhere(filters);

    const salespersonName = sql<
        string | null
    >`${users.firstName} || ' ' || ${users.lastName}`;

    const lastInvoiceDateSql = sql<string | null>`(
        select max(${invoices.invoiceDate})
        from ${invoices}
        where ${invoices.customerNumber} = ${customers.customerNumber}
    )`;

    const [rows, [totals], [totalCountRow]] = await Promise.all([
        db
            .select({
                customerNumber: customers.customerNumber,
                customerName: customers.customerName,
                primaryContactName: customers.primaryContactName,
                mainEmail: customers.mainEmail,
                mainPhone: customers.mainPhone,
                billingCity: customers.billingCity,
                billingStateCode: customers.billingStateCode,
                territoryCode: customers.territoryCode,
                salespersonCode: customers.salespersonCode,
                salespersonName,
                accountStatus: customers.accountStatus,
                accountOpenDate: customers.accountOpenDate,
                lastInvoiceDate: lastInvoiceDateSql,
            })
            .from(customers)
            .leftJoin(users, eq(customers.salespersonCode, users.employeeId))
            .where(where)
            .orderBy(asc(customers.customerName))
            .limit(pageSize)
            .offset(offset),
        // Stats scoped to current filter (excluding status so that the counts
        // of active vs inactive make sense regardless of the selected status).
        db
            .select({
                total: count(),
                active: sql<number>`count(*) filter (where ${customers.accountStatus} = 'active')`,
                inactive: sql<number>`count(*) filter (where ${customers.accountStatus} = 'inactive')`,
                onHold: sql<number>`count(*) filter (where ${customers.accountStatus} = 'on_hold')`,
                territories: countDistinct(customers.territoryCode),
                newLast90: sql<number>`count(*) filter (where ${customers.accountOpenDate} >= ${todayIso()}::date - interval '90 days')`,
            })
            .from(customers)
            .where(buildListingWhere({ ...filters, status: 'all' })),
        db.select({ total: count() }).from(customers).where(where),
    ]);

    return {
        rows,
        stats: {
            total: Number(totals?.total ?? 0),
            active: Number(totals?.active ?? 0),
            inactive: Number(totals?.inactive ?? 0),
            onHold: Number(totals?.onHold ?? 0),
            territories: Number(totals?.territories ?? 0),
            newLast90: Number(totals?.newLast90 ?? 0),
        },
        page,
        pageSize,
        totalCount: Number(totalCountRow?.total ?? 0),
        totalPages: Math.max(
            1,
            Math.ceil(Number(totalCountRow?.total ?? 0) / pageSize),
        ),
    };
}

export type CustomerListingRow = Awaited<
    ReturnType<typeof getCustomerListingReport>
>['rows'][number];

// -----------------------------------------------------------------------------
// 2. Customer Invoice Summary
// -----------------------------------------------------------------------------

export type CustomerInvoicesFilters = {
    view: 'per-customer' | 'all';
    customerNumber?: string;
    salesperson?: string;
    territory?: string;
    status?: InvoiceStatus | 'all';
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
    invPage?: number;
    invPageSize?: number;
};

const INVOICE_PAGE_SIZE = 50;
const PER_CUSTOMER_INVOICE_PAGE_SIZE = 25;

function rowsWithPagination<T>(
    rows: T[],
    page: number,
    pageSize: number,
    totalCount: number,
) {
    return {
        rows,
        page,
        pageSize,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    };
}

function buildInvoiceWhere(
    filters: Pick<
        CustomerInvoicesFilters,
        | 'customerNumber'
        | 'salesperson'
        | 'territory'
        | 'status'
        | 'startDate'
        | 'endDate'
    >,
) {
    const conditions = [];
    if (filters.customerNumber) {
        conditions.push(eq(invoices.customerNumber, filters.customerNumber));
    }
    if (filters.salesperson) {
        conditions.push(eq(invoices.salespersonCode, filters.salesperson));
    }
    if (filters.territory) {
        conditions.push(eq(invoices.territoryCode, filters.territory));
    }
    if (filters.status && filters.status !== 'all') {
        conditions.push(eq(invoices.invoiceStatus, filters.status));
    }
    if (filters.startDate) {
        conditions.push(gte(invoices.invoiceDate, filters.startDate));
    }
    if (filters.endDate) {
        conditions.push(lte(invoices.invoiceDate, filters.endDate));
    }
    return conditions.length ? and(...conditions) : undefined;
}

/** Per-customer invoice summary: paginated invoices + aggregate stats. */
export async function getInvoiceSummaryPerCustomer(
    filters: CustomerInvoicesFilters & { customerNumber: string },
) {
    // The Per Customer tab only offers customer + date filters. Ignore any
    // salesperson/territory/status left in the URL by the All Customers tab.
    const where = buildInvoiceWhere({
        customerNumber: filters.customerNumber,
        startDate: filters.startDate,
        endDate: filters.endDate,
    });
    const invPage = Math.max(1, filters.invPage ?? 1);
    const invPageSize = filters.invPageSize ?? PER_CUSTOMER_INVOICE_PAGE_SIZE;

    const [customer, invoiceRows, [invoiceTotals], [totals]] =
        await Promise.all([
            db
                .select({
                    customerNumber: customers.customerNumber,
                    customerName: customers.customerName,
                    primaryContactName: customers.primaryContactName,
                    territoryCode: customers.territoryCode,
                    salespersonCode: customers.salespersonCode,
                    termCode: customers.termCode,
                    accountStatus: customers.accountStatus,
                    creditBalance: customers.creditBalance,
                })
                .from(customers)
                .where(eq(customers.customerNumber, filters.customerNumber))
                .limit(1),
            db
                .select({
                    invoiceNumber: invoices.invoiceNumber,
                    orderNumber: invoices.orderNumber,
                    invoiceDate: invoices.invoiceDate,
                    dueDate: invoices.dueDate,
                    paidDate: invoices.paidDate,
                    totalAmount: invoices.totalAmount,
                    amountPaid: invoices.amountPaid,
                    balanceDue: invoices.balanceDue,
                    invoiceStatus: invoices.invoiceStatus,
                    customerPoReference: invoices.customerPoReference,
                })
                .from(invoices)
                .where(where)
                .orderBy(desc(invoices.invoiceDate))
                .limit(invPageSize)
                .offset((invPage - 1) * invPageSize),
            db.select({ total: count() }).from(invoices).where(where),
            db
                .select({
                    invoiceCount: count(),
                    totalInvoiced: sql<string>`coalesce(sum(${invoices.totalAmount}), 0)`,
                    totalPaid: sql<string>`coalesce(sum(${invoices.amountPaid}), 0)`,
                    balanceDue: sql<string>`coalesce(sum(${invoices.balanceDue}), 0)`,
                    openCount: sql<number>`count(*) filter (where ${invoices.invoiceStatus} in ('open', 'partially_paid'))`,
                })
                .from(invoices)
                .where(where),
        ]);

    const invoiceTotalCount = Number(invoiceTotals?.total ?? 0);

    return {
        customer: customer[0] ?? null,
        invoices: rowsWithPagination(
            invoiceRows,
            invPage,
            invPageSize,
            invoiceTotalCount,
        ),
        stats: {
            invoiceCount: Number(totals?.invoiceCount ?? 0),
            totalInvoiced: Number(totals?.totalInvoiced ?? 0),
            totalPaid: Number(totals?.totalPaid ?? 0),
            balanceDue: Number(totals?.balanceDue ?? 0),
            openCount: Number(totals?.openCount ?? 0),
        },
    };
}

/** All-customers invoice summary: one row per customer with aggregates. */
export async function getInvoiceSummaryAllCustomers(
    filters: CustomerInvoicesFilters,
) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = filters.pageSize ?? INVOICE_PAGE_SIZE;
    const offset = (page - 1) * pageSize;
    // The All Customers tab has no customer filter. Ignore a customer left in
    // the URL by the Per Customer tab.
    const where = buildInvoiceWhere({ ...filters, customerNumber: undefined });

    const subquery = db
        .select({
            customerNumber: invoices.customerNumber,
            invoiceCount: count().as('invoice_count'),
            totalInvoiced:
                sql<string>`coalesce(sum(${invoices.totalAmount}), 0)`.as(
                    'total_invoiced',
                ),
            totalPaid: sql<string>`coalesce(sum(${invoices.amountPaid}), 0)`.as(
                'total_paid',
            ),
            balanceDue:
                sql<string>`coalesce(sum(${invoices.balanceDue}), 0)`.as(
                    'balance_due',
                ),
            lastInvoiceDate: sql<string>`max(${invoices.invoiceDate})`.as(
                'agg_last_invoice_date',
            ),
        })
        .from(invoices)
        .where(where)
        .groupBy(invoices.customerNumber)
        .as('agg');

    const [rows, [totalsRow], [countRow]] = await Promise.all([
        db
            .select({
                customerNumber: customers.customerNumber,
                customerName: customers.customerName,
                territoryCode: customers.territoryCode,
                salespersonCode: customers.salespersonCode,
                invoiceCount: subquery.invoiceCount,
                totalInvoiced: subquery.totalInvoiced,
                totalPaid: subquery.totalPaid,
                balanceDue: subquery.balanceDue,
                lastInvoiceDate: subquery.lastInvoiceDate,
            })
            .from(subquery)
            .innerJoin(
                customers,
                eq(customers.customerNumber, subquery.customerNumber),
            )
            .orderBy(desc(subquery.totalInvoiced))
            .limit(pageSize)
            .offset(offset),
        db
            .select({
                totalInvoiced: sql<string>`coalesce(sum(${invoices.totalAmount}), 0)`,
                totalPaid: sql<string>`coalesce(sum(${invoices.amountPaid}), 0)`,
                balanceDue: sql<string>`coalesce(sum(${invoices.balanceDue}), 0)`,
                invoiceCount: count(),
                customerCount: countDistinct(invoices.customerNumber),
            })
            .from(invoices)
            .where(where),
        db
            .select({ total: countDistinct(invoices.customerNumber) })
            .from(invoices)
            .where(where),
    ]);

    return {
        rows,
        stats: {
            customerCount: Number(totalsRow?.customerCount ?? 0),
            invoiceCount: Number(totalsRow?.invoiceCount ?? 0),
            totalInvoiced: Number(totalsRow?.totalInvoiced ?? 0),
            totalPaid: Number(totalsRow?.totalPaid ?? 0),
            balanceDue: Number(totalsRow?.balanceDue ?? 0),
        },
        page,
        pageSize,
        totalCount: Number(countRow?.total ?? 0),
        totalPages: Math.max(
            1,
            Math.ceil(Number(countRow?.total ?? 0) / pageSize),
        ),
    };
}

export type InvoiceSummaryAllRow = Awaited<
    ReturnType<typeof getInvoiceSummaryAllCustomers>
>['rows'][number];

// -----------------------------------------------------------------------------
// 3. Customer Purchase History
// -----------------------------------------------------------------------------

export type CustomerPurchasesFilters = {
    view: 'per-customer' | 'all';
    customerNumber?: string;
    startDate?: string;
    endDate?: string;
    salesperson?: string;
    territory?: string;
    page?: number;
    pageSize?: number;
    itemPage?: number;
    itemPageSize?: number;
};

const PURCHASE_PAGE_SIZE = 50;
const PER_CUSTOMER_ITEM_PAGE_SIZE = 50;

/** Resolve purchase-history date range from filters, defaulting to the last 3 months. */
function resolvePurchaseRange(filters: {
    startDate?: string;
    endDate?: string;
}) {
    const fallback = getPeriodRange('3m');
    return {
        startDate: filters.startDate ?? fallback.startDate,
        endDate: filters.endDate ?? fallback.endDate,
    };
}

/** Per-customer: products purchased over the selected period (billed via invoices). */
export async function getPurchaseHistoryPerCustomer(
    filters: CustomerPurchasesFilters & { customerNumber: string },
) {
    const { startDate, endDate } = resolvePurchaseRange(filters);
    const itemPage = Math.max(1, filters.itemPage ?? 1);
    const itemPageSize = filters.itemPageSize ?? PER_CUSTOMER_ITEM_PAGE_SIZE;

    const where = and(
        eq(invoices.customerNumber, filters.customerNumber),
        gte(invoices.invoiceDate, startDate),
        lte(invoices.invoiceDate, endDate),
        // only finalized (billed) quantities
        ne(invoices.invoiceStatus, 'voided'),
    );

    const [customer, rows, [itemTotals], [totals]] = await Promise.all([
        db
            .select({
                customerNumber: customers.customerNumber,
                customerName: customers.customerName,
                territoryCode: customers.territoryCode,
                salespersonCode: customers.salespersonCode,
            })
            .from(customers)
            .where(eq(customers.customerNumber, filters.customerNumber))
            .limit(1),
        db
            .select({
                itemNumber: invoiceItems.itemNumber,
                description: products.description,
                totalQty: sql<number>`coalesce(sum(${invoiceItems.qtyShipped}), 0)`,
                totalAmount: sql<string>`coalesce(sum(${invoiceItems.lineTotal}), 0)`,
                orderCount: countDistinct(invoiceItems.orderNumber),
                lastPurchaseDate: sql<string>`max(${invoices.invoiceDate})`,
            })
            .from(invoiceItems)
            .innerJoin(
                invoices,
                eq(invoiceItems.invoiceNumber, invoices.invoiceNumber),
            )
            .leftJoin(
                products,
                eq(invoiceItems.itemNumber, products.itemNumber),
            )
            .where(where)
            .groupBy(invoiceItems.itemNumber, products.description)
            .orderBy(
                desc(sql`coalesce(sum(${invoiceItems.lineTotal}), 0)`),
                asc(invoiceItems.itemNumber),
            )
            .limit(itemPageSize)
            .offset((itemPage - 1) * itemPageSize),
        db
            .select({ total: countDistinct(invoiceItems.itemNumber) })
            .from(invoiceItems)
            .innerJoin(
                invoices,
                eq(invoiceItems.invoiceNumber, invoices.invoiceNumber),
            )
            .where(where),
        db
            .select({
                invoiceCount: countDistinct(invoices.invoiceNumber),
                orderCount: countDistinct(invoiceItems.orderNumber),
                totalQty: sql<number>`coalesce(sum(${invoiceItems.qtyShipped}), 0)`,
                totalAmount: sql<string>`coalesce(sum(${invoiceItems.lineTotal}), 0)`,
            })
            .from(invoiceItems)
            .innerJoin(
                invoices,
                eq(invoiceItems.invoiceNumber, invoices.invoiceNumber),
            )
            .where(where),
    ]);

    const itemTotalCount = Number(itemTotals?.total ?? 0);

    return {
        customer: customer[0] ?? null,
        periodRange: { startDate, endDate },
        rows: rowsWithPagination(rows, itemPage, itemPageSize, itemTotalCount),
        stats: {
            invoiceCount: Number(totals?.invoiceCount ?? 0),
            orderCount: Number(totals?.orderCount ?? 0),
            totalQty: Number(totals?.totalQty ?? 0),
            totalAmount: Number(totals?.totalAmount ?? 0),
        },
    };
}

export type PurchaseHistoryItemRow = Awaited<
    ReturnType<typeof getPurchaseHistoryPerCustomer>
>['rows']['rows'][number];

/** Cross-customer: ranked list of customers by spend over the selected period. */
export async function getPurchaseHistoryAllCustomers(
    filters: CustomerPurchasesFilters,
) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = filters.pageSize ?? PURCHASE_PAGE_SIZE;
    const offset = (page - 1) * pageSize;
    const { startDate, endDate } = resolvePurchaseRange(filters);

    const conditions = [
        gte(invoices.invoiceDate, startDate),
        lte(invoices.invoiceDate, endDate),
        ne(invoices.invoiceStatus, 'voided'),
    ];
    if (filters.salesperson) {
        conditions.push(eq(invoices.salespersonCode, filters.salesperson));
    }
    if (filters.territory) {
        conditions.push(eq(invoices.territoryCode, filters.territory));
    }
    const where = and(...conditions);

    const subquery = db
        .select({
            customerNumber: invoices.customerNumber,
            orderCount: countDistinct(invoiceItems.orderNumber).as(
                'order_count',
            ),
            invoiceCount: countDistinct(invoices.invoiceNumber).as(
                'invoice_count',
            ),
            totalQty:
                sql<number>`coalesce(sum(${invoiceItems.qtyShipped}), 0)`.as(
                    'total_qty',
                ),
            totalAmount:
                sql<string>`coalesce(sum(${invoiceItems.lineTotal}), 0)`.as(
                    'total_amount',
                ),
            lastPurchaseDate: sql<string>`max(${invoices.invoiceDate})`.as(
                'last_purchase_date',
            ),
        })
        .from(invoices)
        .innerJoin(
            invoiceItems,
            eq(invoiceItems.invoiceNumber, invoices.invoiceNumber),
        )
        .where(where)
        .groupBy(invoices.customerNumber)
        .as('purchase_agg');

    const [rows, [totals], [countRow]] = await Promise.all([
        db
            .select({
                customerNumber: customers.customerNumber,
                customerName: customers.customerName,
                territoryCode: customers.territoryCode,
                salespersonCode: customers.salespersonCode,
                orderCount: subquery.orderCount,
                invoiceCount: subquery.invoiceCount,
                totalQty: subquery.totalQty,
                totalAmount: subquery.totalAmount,
                lastPurchaseDate: subquery.lastPurchaseDate,
            })
            .from(subquery)
            .innerJoin(
                customers,
                eq(customers.customerNumber, subquery.customerNumber),
            )
            .orderBy(desc(subquery.totalAmount))
            .limit(pageSize)
            .offset(offset),
        db
            .select({
                customerCount: countDistinct(invoices.customerNumber),
                orderCount: countDistinct(invoiceItems.orderNumber),
                invoiceCount: countDistinct(invoices.invoiceNumber),
                totalQty: sql<number>`coalesce(sum(${invoiceItems.qtyShipped}), 0)`,
                totalAmount: sql<string>`coalesce(sum(${invoiceItems.lineTotal}), 0)`,
            })
            .from(invoices)
            .innerJoin(
                invoiceItems,
                eq(invoiceItems.invoiceNumber, invoices.invoiceNumber),
            )
            .where(where),
        db
            .select({ total: countDistinct(invoices.customerNumber) })
            .from(invoices)
            .innerJoin(
                invoiceItems,
                eq(invoiceItems.invoiceNumber, invoices.invoiceNumber),
            )
            .where(where),
    ]);

    return {
        rows,
        periodRange: { startDate, endDate },
        stats: {
            customerCount: Number(totals?.customerCount ?? 0),
            orderCount: Number(totals?.orderCount ?? 0),
            invoiceCount: Number(totals?.invoiceCount ?? 0),
            totalQty: Number(totals?.totalQty ?? 0),
            totalAmount: Number(totals?.totalAmount ?? 0),
        },
        page,
        pageSize,
        totalCount: Number(countRow?.total ?? 0),
        totalPages: Math.max(
            1,
            Math.ceil(Number(countRow?.total ?? 0) / pageSize),
        ),
    };
}

export type PurchaseHistoryCustomerRow = Awaited<
    ReturnType<typeof getPurchaseHistoryAllCustomers>
>['rows'][number];

// -----------------------------------------------------------------------------
// 4. Sales & Aging Summary
// -----------------------------------------------------------------------------

export type AgingSummaryFilters = {
    asOf?: string;
    customerNumber?: string;
    salesperson?: string;
    territory?: string;
    page?: number;
    pageSize?: number;
};

const AGING_PAGE_SIZE = 50;

export async function getAgingSummary(filters: AgingSummaryFilters) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = filters.pageSize ?? AGING_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const asOfIso = filters.asOf ?? todayIso();
    const now = new Date(`${asOfIso}T00:00:00Z`);
    const { startDate: mtdStart } = getMtdRange(now);
    const { startDate: ytdStart } = getYtdRange(now);
    const { startDate: l12mStart } = getPeriodRange('12m', now);

    // Restrict customer set by optional salesperson/territory/customer
    const customerFilter = [];
    if (filters.customerNumber) {
        customerFilter.push(
            eq(customers.customerNumber, filters.customerNumber),
        );
    }
    if (filters.salesperson) {
        customerFilter.push(eq(customers.salespersonCode, filters.salesperson));
    }
    if (filters.territory) {
        customerFilter.push(eq(customers.territoryCode, filters.territory));
    }
    const customerWhere = customerFilter.length
        ? and(...customerFilter)
        : undefined;

    // Balance each invoice had on the as-of date, rebuilt best-effort: today's
    // balance plus whatever was paid after as-of. Payment rows count on their
    // own dates; any paid amount without payment rows (legacy imports,
    // invoices marked paid by hand) counts as paid on the invoice's paid date.
    // Invoices dated after as-of are excluded below.
    const paymentTotals = db
        .select({
            invoiceNumber: payments.invoiceNumber,
            total: sql<string>`sum(${payments.amount})`.as('payments_total'),
            afterAsOf:
                sql<string>`coalesce(sum(${payments.amount}) filter (where ${payments.paymentDate} > ${asOfIso}::date), 0)`.as(
                    'payments_after_as_of',
                ),
        })
        .from(payments)
        .groupBy(payments.invoiceNumber)
        .as('payment_totals');

    const unrecordedPaid = sql`greatest(${invoices.amountPaid} - coalesce(${paymentTotals.total}, 0), 0)`;
    const paidAfterAsOf = sql`(coalesce(${paymentTotals.afterAsOf}, 0)
        + case when ${invoices.paidDate} > ${asOfIso}::date
            then ${unrecordedPaid} else 0 end)`;
    const balanceAsOf = sql`least(${invoices.totalAmount}, ${invoices.balanceDue} + ${paidAfterAsOf})`;

    // Aging calc done in SQL using days-past-due on coalesce(due_date, invoice_date).
    const ref = sql`coalesce(${invoices.dueDate}, ${invoices.invoiceDate})`;
    const age = sql`(${asOfIso}::date - ${ref})`;

    const agingAgg = db
        .select({
            customerNumber: invoices.customerNumber,
            current:
                sql<string>`coalesce(sum(${balanceAsOf}) filter (where ${age} <= 0), 0)`.as(
                    'current',
                ),
            d1_30: sql<string>`coalesce(sum(${balanceAsOf}) filter (where ${age} between 1 and 30), 0)`.as(
                'd1_30',
            ),
            d31_60: sql<string>`coalesce(sum(${balanceAsOf}) filter (where ${age} between 31 and 60), 0)`.as(
                'd31_60',
            ),
            d61_90: sql<string>`coalesce(sum(${balanceAsOf}) filter (where ${age} between 61 and 90), 0)`.as(
                'd61_90',
            ),
            d90_plus:
                sql<string>`coalesce(sum(${balanceAsOf}) filter (where ${age} > 90), 0)`.as(
                    'd90_plus',
                ),
            balanceDue: sql<string>`coalesce(sum(${balanceAsOf}), 0)`.as(
                'balance_due',
            ),
        })
        .from(invoices)
        .leftJoin(
            paymentTotals,
            eq(paymentTotals.invoiceNumber, invoices.invoiceNumber),
        )
        .where(
            and(
                lte(invoices.invoiceDate, asOfIso),
                ne(invoices.invoiceStatus, 'voided'),
                sql`${balanceAsOf} > 0`,
            ),
        )
        .groupBy(invoices.customerNumber)
        .as('aging_agg');

    const mtdAgg = db
        .select({
            customerNumber: invoices.customerNumber,
            mtd: sql<string>`coalesce(sum(${invoices.totalAmount}), 0)`.as(
                'mtd',
            ),
        })
        .from(invoices)
        .where(
            and(
                gte(invoices.invoiceDate, mtdStart),
                lte(invoices.invoiceDate, asOfIso),
                ne(invoices.invoiceStatus, 'voided'),
            ),
        )
        .groupBy(invoices.customerNumber)
        .as('mtd_agg');

    const ytdAgg = db
        .select({
            customerNumber: invoices.customerNumber,
            ytd: sql<string>`coalesce(sum(${invoices.totalAmount}), 0)`.as(
                'ytd',
            ),
        })
        .from(invoices)
        .where(
            and(
                gte(invoices.invoiceDate, ytdStart),
                lte(invoices.invoiceDate, asOfIso),
                ne(invoices.invoiceStatus, 'voided'),
            ),
        )
        .groupBy(invoices.customerNumber)
        .as('ytd_agg');

    const l12mAgg = db
        .select({
            customerNumber: invoices.customerNumber,
            l12m: sql<string>`coalesce(sum(${invoices.totalAmount}), 0)`.as(
                'l12m',
            ),
        })
        .from(invoices)
        .where(
            and(
                gte(invoices.invoiceDate, l12mStart),
                lte(invoices.invoiceDate, asOfIso),
                ne(invoices.invoiceStatus, 'voided'),
            ),
        )
        .groupBy(invoices.customerNumber)
        .as('l12m_agg');

    // A customer appears in the report if they have any open balance OR any
    // sales activity within the L12M window (so new/active accounts still
    // appear even with zero AR).
    const baseCustomers = db
        .select({ customerNumber: customers.customerNumber })
        .from(customers)
        .where(
            and(
                customerWhere,
                or(
                    sql`${customers.customerNumber} in (select customer_number from ${agingAgg})`,
                    sql`${customers.customerNumber} in (select customer_number from ${l12mAgg})`,
                ),
            ),
        )
        .as('base_customers');

    const [rows, [countRow], [totalsRow]] = await Promise.all([
        db
            .select({
                customerNumber: customers.customerNumber,
                customerName: customers.customerName,
                territoryCode: customers.territoryCode,
                salespersonCode: customers.salespersonCode,
                current: sql<string>`coalesce(${agingAgg.current}, 0)`,
                d1_30: sql<string>`coalesce(${agingAgg.d1_30}, 0)`,
                d31_60: sql<string>`coalesce(${agingAgg.d31_60}, 0)`,
                d61_90: sql<string>`coalesce(${agingAgg.d61_90}, 0)`,
                d90_plus: sql<string>`coalesce(${agingAgg.d90_plus}, 0)`,
                balanceDue: sql<string>`coalesce(${agingAgg.balanceDue}, 0)`,
                mtd: sql<string>`coalesce(${mtdAgg.mtd}, 0)`,
                ytd: sql<string>`coalesce(${ytdAgg.ytd}, 0)`,
                l12m: sql<string>`coalesce(${l12mAgg.l12m}, 0)`,
            })
            .from(baseCustomers)
            .innerJoin(
                customers,
                eq(customers.customerNumber, baseCustomers.customerNumber),
            )
            .leftJoin(
                agingAgg,
                eq(agingAgg.customerNumber, customers.customerNumber),
            )
            .leftJoin(
                mtdAgg,
                eq(mtdAgg.customerNumber, customers.customerNumber),
            )
            .leftJoin(
                ytdAgg,
                eq(ytdAgg.customerNumber, customers.customerNumber),
            )
            .leftJoin(
                l12mAgg,
                eq(l12mAgg.customerNumber, customers.customerNumber),
            )
            .orderBy(desc(sql`coalesce(${agingAgg.balanceDue}, 0)`))
            .limit(pageSize)
            .offset(offset),
        db.select({ total: count() }).from(baseCustomers),
        db
            .select({
                totalAR: sql<string>`coalesce(sum(coalesce(${agingAgg.balanceDue}, 0)), 0)`,
                current: sql<string>`coalesce(sum(coalesce(${agingAgg.current}, 0)), 0)`,
                pastDue: sql<string>`coalesce(sum(coalesce(${agingAgg.d1_30}, 0) + coalesce(${agingAgg.d31_60}, 0) + coalesce(${agingAgg.d61_90}, 0) + coalesce(${agingAgg.d90_plus}, 0)), 0)`,
                pastDueCustomers: sql<number>`count(*) filter (where coalesce(${agingAgg.d1_30}, 0) + coalesce(${agingAgg.d31_60}, 0) + coalesce(${agingAgg.d61_90}, 0) + coalesce(${agingAgg.d90_plus}, 0) > 0)`,
                mtd: sql<string>`coalesce(sum(coalesce(${mtdAgg.mtd}, 0)), 0)`,
                ytd: sql<string>`coalesce(sum(coalesce(${ytdAgg.ytd}, 0)), 0)`,
                l12m: sql<string>`coalesce(sum(coalesce(${l12mAgg.l12m}, 0)), 0)`,
            })
            .from(baseCustomers)
            .innerJoin(
                customers,
                eq(customers.customerNumber, baseCustomers.customerNumber),
            )
            .leftJoin(
                agingAgg,
                eq(agingAgg.customerNumber, customers.customerNumber),
            )
            .leftJoin(
                mtdAgg,
                eq(mtdAgg.customerNumber, customers.customerNumber),
            )
            .leftJoin(
                ytdAgg,
                eq(ytdAgg.customerNumber, customers.customerNumber),
            )
            .leftJoin(
                l12mAgg,
                eq(l12mAgg.customerNumber, customers.customerNumber),
            ),
    ]);

    return {
        asOfDate: asOfIso,
        rows,
        stats: {
            totalAR: Number(totalsRow?.totalAR ?? 0),
            current: Number(totalsRow?.current ?? 0),
            pastDue: Number(totalsRow?.pastDue ?? 0),
            pastDueCustomers: Number(totalsRow?.pastDueCustomers ?? 0),
            mtd: Number(totalsRow?.mtd ?? 0),
            ytd: Number(totalsRow?.ytd ?? 0),
            l12m: Number(totalsRow?.l12m ?? 0),
        },
        page,
        pageSize,
        totalCount: Number(countRow?.total ?? 0),
        totalPages: Math.max(
            1,
            Math.ceil(Number(countRow?.total ?? 0) / pageSize),
        ),
    };
}

export type AgingSummaryRow = Awaited<
    ReturnType<typeof getAgingSummary>
>['rows'][number];

// -----------------------------------------------------------------------------
// Picker support (for customer picker in per-customer views)
// -----------------------------------------------------------------------------

export async function searchCustomersForPicker(search: string, limit = 20) {
    const term = `%${search.trim()}%`;
    return db
        .select({
            customerNumber: customers.customerNumber,
            customerName: customers.customerName,
        })
        .from(customers)
        .where(
            or(
                ilike(customers.customerName, term),
                ilike(customers.customerNumber, term),
            ),
        )
        .orderBy(asc(customers.customerName))
        .limit(limit);
}
