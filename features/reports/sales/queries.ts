import { and, asc, count, desc, eq, gte, lte, ne, or, sql } from 'drizzle-orm';
import db from '@/lib/db';
import { todayIso } from '@/lib/dates';
import { customers } from '@/features/customers/schema';
import { invoices } from '@/features/invoices/schema';
import { users } from '@/features/users/schema';
import { getMtdRange, getPeriodRange, getYtdRange } from '../service';

export type AgingBySalespersonFilters = {
    territory?: string;
    salesperson?: string;
    page?: number;
    pageSize?: number;
};

const AGING_SALES_PAGE_SIZE = 100;

/**
 * Aggregate aging (AR) and sales totals grouped by salesperson.
 * Aging is bucketed on days past due relative to `coalesce(due_date, invoice_date)`.
 * MTD / YTD / L12M sales are sums of invoice totals (excluding voided) in their windows.
 */
export async function getAgingBySalesperson(
    filters: AgingBySalespersonFilters,
) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = filters.pageSize ?? AGING_SALES_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const asOfIso = todayIso();
    const now = new Date(`${asOfIso}T00:00:00Z`);
    const { startDate: mtdStart } = getMtdRange(now);
    const { startDate: ytdStart } = getYtdRange(now);
    const { startDate: l12mStart } = getPeriodRange('12m', now);

    const territoryFilter = filters.territory
        ? eq(invoices.territoryCode, filters.territory)
        : undefined;
    const salespersonFilter = filters.salesperson
        ? eq(invoices.salespersonCode, filters.salesperson)
        : undefined;

    const ref = sql`coalesce(${invoices.dueDate}, ${invoices.invoiceDate})`;

    // Aging aggregation per salesperson (only rows with balance due > 0).
    const agingAgg = db
        .select({
            salespersonCode: invoices.salespersonCode,
            current:
                sql<string>`coalesce(sum(${invoices.balanceDue}) filter (where (${asOfIso}::date - ${ref}) <= 0), 0)`.as(
                    'current',
                ),
            d1_30: sql<string>`coalesce(sum(${invoices.balanceDue}) filter (where (${asOfIso}::date - ${ref}) between 1 and 30), 0)`.as(
                'd1_30',
            ),
            d31_60: sql<string>`coalesce(sum(${invoices.balanceDue}) filter (where (${asOfIso}::date - ${ref}) between 31 and 60), 0)`.as(
                'd31_60',
            ),
            d61_90: sql<string>`coalesce(sum(${invoices.balanceDue}) filter (where (${asOfIso}::date - ${ref}) between 61 and 90), 0)`.as(
                'd61_90',
            ),
            d90_plus:
                sql<string>`coalesce(sum(${invoices.balanceDue}) filter (where (${asOfIso}::date - ${ref}) > 90), 0)`.as(
                    'd90_plus',
                ),
            balanceDue:
                sql<string>`coalesce(sum(${invoices.balanceDue}), 0)`.as(
                    'balance_due',
                ),
            openInvoiceCount:
                sql<number>`count(*) filter (where ${invoices.balanceDue} > 0)`.as(
                    'open_invoice_count',
                ),
            customerCount:
                sql<number>`count(distinct ${invoices.customerNumber}) filter (where ${invoices.balanceDue} > 0)`.as(
                    'aging_customer_count',
                ),
        })
        .from(invoices)
        .where(
            and(
                sql`${invoices.balanceDue} > 0`,
                territoryFilter,
                salespersonFilter,
            ),
        )
        .groupBy(invoices.salespersonCode)
        .as('aging_agg');

    // Sales windows per salesperson.
    const salesAgg = db
        .select({
            salespersonCode: invoices.salespersonCode,
            mtd: sql<string>`coalesce(sum(${invoices.totalAmount}) filter (where ${invoices.invoiceDate} >= ${mtdStart} and ${invoices.invoiceDate} <= ${asOfIso}), 0)`.as(
                'mtd',
            ),
            ytd: sql<string>`coalesce(sum(${invoices.totalAmount}) filter (where ${invoices.invoiceDate} >= ${ytdStart} and ${invoices.invoiceDate} <= ${asOfIso}), 0)`.as(
                'ytd',
            ),
            l12m: sql<string>`coalesce(sum(${invoices.totalAmount}) filter (where ${invoices.invoiceDate} >= ${l12mStart} and ${invoices.invoiceDate} <= ${asOfIso}), 0)`.as(
                'l12m',
            ),
            salesCustomerCount:
                sql<number>`count(distinct ${invoices.customerNumber}) filter (where ${invoices.invoiceDate} >= ${l12mStart} and ${invoices.invoiceDate} <= ${asOfIso})`.as(
                    'sales_customer_count',
                ),
        })
        .from(invoices)
        .where(
            and(
                ne(invoices.invoiceStatus, 'voided'),
                gte(invoices.invoiceDate, l12mStart),
                lte(invoices.invoiceDate, asOfIso),
                territoryFilter,
                salespersonFilter,
            ),
        )
        .groupBy(invoices.salespersonCode)
        .as('sales_agg');

    // Base: active salespeople + any salesperson that has aging or sales activity.
    // When a specific salesperson is selected, scope to just that one.
    const baseSalespeople = db
        .select({ employeeId: users.employeeId })
        .from(users)
        .where(
            and(
                filters.salesperson
                    ? eq(users.employeeId, filters.salesperson)
                    : undefined,
                or(
                    eq(users.isActive, true),
                    sql`${users.employeeId} in (select salesperson_code from ${agingAgg})`,
                    sql`${users.employeeId} in (select salesperson_code from ${salesAgg})`,
                ),
            ),
        )
        .as('base_sales');

    const salespersonName = sql<string>`${users.firstName} || ' ' || ${users.lastName}`;

    const [rows, [countRow], [totalsRow]] = await Promise.all([
        db
            .select({
                salespersonCode: users.employeeId,
                salespersonName,
                isActive: users.isActive,
                current: sql<string>`coalesce(${agingAgg.current}, 0)`,
                d1_30: sql<string>`coalesce(${agingAgg.d1_30}, 0)`,
                d31_60: sql<string>`coalesce(${agingAgg.d31_60}, 0)`,
                d61_90: sql<string>`coalesce(${agingAgg.d61_90}, 0)`,
                d90_plus: sql<string>`coalesce(${agingAgg.d90_plus}, 0)`,
                balanceDue: sql<string>`coalesce(${agingAgg.balanceDue}, 0)`,
                openInvoiceCount: sql<number>`coalesce(${agingAgg.openInvoiceCount}, 0)`,
                agingCustomerCount: sql<number>`coalesce(${agingAgg.customerCount}, 0)`,
                mtd: sql<string>`coalesce(${salesAgg.mtd}, 0)`,
                ytd: sql<string>`coalesce(${salesAgg.ytd}, 0)`,
                l12m: sql<string>`coalesce(${salesAgg.l12m}, 0)`,
                salesCustomerCount: sql<number>`coalesce(${salesAgg.salesCustomerCount}, 0)`,
            })
            .from(baseSalespeople)
            .innerJoin(users, eq(users.employeeId, baseSalespeople.employeeId))
            .leftJoin(agingAgg, eq(agingAgg.salespersonCode, users.employeeId))
            .leftJoin(salesAgg, eq(salesAgg.salespersonCode, users.employeeId))
            .orderBy(
                desc(sql`coalesce(${agingAgg.balanceDue}, 0)`),
                asc(users.lastName),
                asc(users.firstName),
            )
            .limit(pageSize)
            .offset(offset),
        db.select({ total: count() }).from(baseSalespeople),
        db
            .select({
                totalAR: sql<string>`coalesce(sum(coalesce(${agingAgg.balanceDue}, 0)), 0)`,
                current: sql<string>`coalesce(sum(coalesce(${agingAgg.current}, 0)), 0)`,
                pastDue: sql<string>`coalesce(sum(coalesce(${agingAgg.d1_30}, 0) + coalesce(${agingAgg.d31_60}, 0) + coalesce(${agingAgg.d61_90}, 0) + coalesce(${agingAgg.d90_plus}, 0)), 0)`,
                mtd: sql<string>`coalesce(sum(coalesce(${salesAgg.mtd}, 0)), 0)`,
                ytd: sql<string>`coalesce(sum(coalesce(${salesAgg.ytd}, 0)), 0)`,
                l12m: sql<string>`coalesce(sum(coalesce(${salesAgg.l12m}, 0)), 0)`,
                salespersonCount: sql<number>`count(*) filter (where coalesce(${agingAgg.balanceDue}, 0) > 0 or coalesce(${salesAgg.l12m}, 0) > 0)`,
            })
            .from(baseSalespeople)
            .innerJoin(users, eq(users.employeeId, baseSalespeople.employeeId))
            .leftJoin(agingAgg, eq(agingAgg.salespersonCode, users.employeeId))
            .leftJoin(salesAgg, eq(salesAgg.salespersonCode, users.employeeId)),
    ]);

    return {
        asOfDate: asOfIso,
        rows,
        stats: {
            totalAR: Number(totalsRow?.totalAR ?? 0),
            current: Number(totalsRow?.current ?? 0),
            pastDue: Number(totalsRow?.pastDue ?? 0),
            mtd: Number(totalsRow?.mtd ?? 0),
            ytd: Number(totalsRow?.ytd ?? 0),
            l12m: Number(totalsRow?.l12m ?? 0),
            salespersonCount: Number(totalsRow?.salespersonCount ?? 0),
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

export type AgingBySalespersonRow = Awaited<
    ReturnType<typeof getAgingBySalesperson>
>['rows'][number];

/** Salespeople (active + any with invoice activity) used for filter options. */
export async function getSalespersonOptions(): Promise<
    Array<{ employeeId: string; name: string }>
> {
    const rows = await db
        .select({
            employeeId: users.employeeId,
            firstName: users.firstName,
            lastName: users.lastName,
            isActive: users.isActive,
        })
        .from(users)
        .where(
            or(
                eq(users.isActive, true),
                sql`${users.employeeId} in (select distinct ${invoices.salespersonCode} from ${invoices})`,
            ),
        )
        .orderBy(asc(users.lastName), asc(users.firstName));
    return rows.map((r) => ({
        employeeId: r.employeeId,
        name: `${r.firstName} ${r.lastName}${r.isActive ? '' : ' (inactive)'}`,
    }));
}

// -----------------------------------------------------------------------------
// Salesperson Aging Detail — open invoices grouped by customer for one rep.
// -----------------------------------------------------------------------------

export type SalespersonAgingDetailFilters = {
    employeeId: string;
    territory?: string;
    page?: number;
    pageSize?: number;
};

/** Customers (not invoices) per page — a customer's invoices never split. */
const AGING_DETAIL_PAGE_SIZE = 25;

export async function findSalespersonByEmployeeId(employeeId: string) {
    const [row] = await db
        .select({
            employeeId: users.employeeId,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.employeeId, employeeId))
        .limit(1);
    return row ?? null;
}

export async function getSalespersonAgingDetail(
    filters: SalespersonAgingDetailFilters,
) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = filters.pageSize ?? AGING_DETAIL_PAGE_SIZE;

    const asOfIso = todayIso();
    const now = new Date(`${asOfIso}T00:00:00Z`);
    const { startDate: mtdStart } = getMtdRange(now);
    const { startDate: ytdStart } = getYtdRange(now);
    const { startDate: l12mStart } = getPeriodRange('12m', now);

    const ref = sql`coalesce(${invoices.dueDate}, ${invoices.invoiceDate})`;
    const territoryFilter = filters.territory
        ? eq(invoices.territoryCode, filters.territory)
        : undefined;

    // Open invoices for this rep (balance > 0), with aging bucket flags.
    const openInvoices = await db
        .select({
            invoiceNumber: invoices.invoiceNumber,
            orderNumber: invoices.orderNumber,
            customerNumber: invoices.customerNumber,
            customerName: customers.customerName,
            primaryContactName: customers.primaryContactName,
            mainPhone: customers.mainPhone,
            termCode: customers.termCode,
            territoryCode: invoices.territoryCode,
            invoiceDate: invoices.invoiceDate,
            dueDate: invoices.dueDate,
            totalAmount: invoices.totalAmount,
            amountPaid: invoices.amountPaid,
            balanceDue: invoices.balanceDue,
            invoiceStatus: invoices.invoiceStatus,
            daysPastDue: sql<number>`(${asOfIso}::date - ${ref})::int`,
        })
        .from(invoices)
        .innerJoin(
            customers,
            eq(customers.customerNumber, invoices.customerNumber),
        )
        .where(
            and(
                eq(invoices.salespersonCode, filters.employeeId),
                sql`${invoices.balanceDue} > 0`,
                territoryFilter,
            ),
        )
        .orderBy(asc(customers.customerNumber), asc(invoices.invoiceDate));

    // Sales totals (MTD/YTD/L12M) for this rep.
    const [salesRow] = await db
        .select({
            mtd: sql<string>`coalesce(sum(${invoices.totalAmount}) filter (where ${invoices.invoiceDate} >= ${mtdStart} and ${invoices.invoiceDate} <= ${asOfIso}), 0)`,
            ytd: sql<string>`coalesce(sum(${invoices.totalAmount}) filter (where ${invoices.invoiceDate} >= ${ytdStart} and ${invoices.invoiceDate} <= ${asOfIso}), 0)`,
            l12m: sql<string>`coalesce(sum(${invoices.totalAmount}) filter (where ${invoices.invoiceDate} >= ${l12mStart} and ${invoices.invoiceDate} <= ${asOfIso}), 0)`,
            invoiceCount: sql<number>`count(*) filter (where ${invoices.invoiceDate} >= ${l12mStart} and ${invoices.invoiceDate} <= ${asOfIso})`,
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.salespersonCode, filters.employeeId),
                ne(invoices.invoiceStatus, 'voided'),
                gte(invoices.invoiceDate, l12mStart),
                lte(invoices.invoiceDate, asOfIso),
                territoryFilter,
            ),
        );

    // Group open invoices by customer and compute buckets.
    type InvoiceRow = (typeof openInvoices)[number];
    type CustomerGroup = {
        customerNumber: string;
        customerName: string;
        primaryContactName: string;
        mainPhone: string;
        termCode: string;
        territoryCode: string;
        invoices: (InvoiceRow & {
            current: number;
            d1_30: number;
            d31_60: number;
            d61_90: number;
            d90_plus: number;
        })[];
        current: number;
        d1_30: number;
        d31_60: number;
        d61_90: number;
        d90_plus: number;
        balanceDue: number;
    };

    const groupsMap = new Map<string, CustomerGroup>();
    for (const row of openInvoices) {
        const days = Number(row.daysPastDue ?? 0);
        const balance = Number(row.balanceDue);
        const bucket = {
            current: days <= 0 ? balance : 0,
            d1_30: days >= 1 && days <= 30 ? balance : 0,
            d31_60: days >= 31 && days <= 60 ? balance : 0,
            d61_90: days >= 61 && days <= 90 ? balance : 0,
            d90_plus: days > 90 ? balance : 0,
        };

        let group = groupsMap.get(row.customerNumber);
        if (!group) {
            group = {
                customerNumber: row.customerNumber,
                customerName: row.customerName,
                primaryContactName: row.primaryContactName,
                mainPhone: row.mainPhone,
                termCode: row.termCode,
                territoryCode: row.territoryCode,
                invoices: [],
                current: 0,
                d1_30: 0,
                d31_60: 0,
                d61_90: 0,
                d90_plus: 0,
                balanceDue: 0,
            };
            groupsMap.set(row.customerNumber, group);
        }

        group.invoices.push({ ...row, ...bucket });
        group.current += bucket.current;
        group.d1_30 += bucket.d1_30;
        group.d31_60 += bucket.d31_60;
        group.d61_90 += bucket.d61_90;
        group.d90_plus += bucket.d90_plus;
        group.balanceDue += balance;
    }

    const groups = Array.from(groupsMap.values()).sort(
        (a, b) => b.balanceDue - a.balanceDue,
    );

    const totals = groups.reduce(
        (acc, g) => ({
            current: acc.current + g.current,
            d1_30: acc.d1_30 + g.d1_30,
            d31_60: acc.d31_60 + g.d31_60,
            d61_90: acc.d61_90 + g.d61_90,
            d90_plus: acc.d90_plus + g.d90_plus,
            balanceDue: acc.balanceDue + g.balanceDue,
            invoiceCount: acc.invoiceCount + g.invoices.length,
        }),
        {
            current: 0,
            d1_30: 0,
            d31_60: 0,
            d61_90: 0,
            d90_plus: 0,
            balanceDue: 0,
            invoiceCount: 0,
        },
    );

    const offset = (page - 1) * pageSize;

    return {
        asOfDate: asOfIso,
        groups: groups.slice(offset, offset + pageSize),
        page,
        pageSize,
        totalCount: groups.length,
        totalPages: Math.max(1, Math.ceil(groups.length / pageSize)),
        totals: {
            ...totals,
            pastDue:
                totals.d1_30 + totals.d31_60 + totals.d61_90 + totals.d90_plus,
            customerCount: groups.length,
            mtd: Number(salesRow?.mtd ?? 0),
            ytd: Number(salesRow?.ytd ?? 0),
            l12m: Number(salesRow?.l12m ?? 0),
            l12mInvoiceCount: Number(salesRow?.invoiceCount ?? 0),
        },
    };
}

export type SalespersonAgingDetail = Awaited<
    ReturnType<typeof getSalespersonAgingDetail>
>;
export type SalespersonAgingGroup = SalespersonAgingDetail['groups'][number];
