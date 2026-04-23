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
    type SQL,
} from 'drizzle-orm';
import db from '@/lib/db';
import { customers } from '@/features/customers/schema';
import { invoices, invoiceItems } from '@/features/invoices/schema';
import { products } from '@/features/products/schema';
import { getPeriodRange } from '../service';
import type { StockStatus } from './validation';

// -----------------------------------------------------------------------------
// Inventory Status Report
// -----------------------------------------------------------------------------

export type InventoryStatusFilters = {
    search?: string;
    unitSoldBy?: string;
    stockStatus?: StockStatus;
    page?: number;
    pageSize?: number;
};

const INVENTORY_PAGE_SIZE = 50;

function stockStatusCondition(
    status: StockStatus | undefined,
): SQL | undefined {
    switch (status) {
        case 'out_of_stock':
            return and(
                eq(products.isDiscontinued, false),
                sql`${products.qtyAvailable} <= 0`,
            );
        case 'low_stock':
            return and(
                eq(products.isDiscontinued, false),
                sql`${products.qtyAvailable} > 0`,
                sql`${products.minQty} > 0`,
                sql`${products.qtyAvailable} < ${products.minQty}`,
            );
        case 'in_stock':
            return and(
                eq(products.isDiscontinued, false),
                sql`${products.qtyAvailable} > 0`,
                or(
                    sql`${products.minQty} = 0`,
                    sql`${products.qtyAvailable} >= ${products.minQty}`,
                )!,
            );
        case 'discontinued':
            return eq(products.isDiscontinued, true);
        case 'incoming':
            return sql`${products.upcomingShipmentQty} > 0`;
        case 'all':
        case undefined:
            return undefined;
    }
}

function buildInventoryWhere(filters: InventoryStatusFilters): SQL | undefined {
    const conditions: (SQL | undefined)[] = [];
    if (filters.unitSoldBy) {
        conditions.push(eq(products.unitSoldBy, filters.unitSoldBy));
    }
    if (filters.search) {
        const term = `%${filters.search.trim()}%`;
        conditions.push(
            or(
                ilike(products.itemNumber, term),
                ilike(products.description, term),
                ilike(products.upcNumber, term),
            ),
        );
    }
    const stock = stockStatusCondition(filters.stockStatus);
    if (stock) conditions.push(stock);

    const filtered = conditions.filter(Boolean) as SQL[];
    return filtered.length ? and(...filtered) : undefined;
}

export async function getInventoryStatusReport(
    filters: InventoryStatusFilters,
) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = filters.pageSize ?? INVENTORY_PAGE_SIZE;
    const offset = (page - 1) * pageSize;
    const where = buildInventoryWhere(filters);

    // Stat counters respect search/type filters, but independently count each
    // stock bucket so users can see how many fall in each.
    const statsWhere = buildInventoryWhere({
        search: filters.search,
        unitSoldBy: filters.unitSoldBy,
        stockStatus: 'all',
    });

    const [rows, [totalsRow], [statsRow]] = await Promise.all([
        db
            .select({
                productId: products.productId,
                itemNumber: products.itemNumber,
                description: products.description,
                productType: products.productType,
                unitSoldBy: products.unitSoldBy,
                minQty: products.minQty,
                maxQty: products.maxQty,
                qtyInStock: products.qtyInStock,
                qtyCommitted: products.qtyCommitted,
                qtyAvailable: products.qtyAvailable,
                qtyOnOrder: products.qtyOnOrder,
                upcomingShipmentNo: products.upcomingShipmentNo,
                upcomingShipmentArrival: products.upcomingShipmentArrival,
                upcomingShipmentQty: products.upcomingShipmentQty,
                landedCost: products.landedCost,
                casePrice: products.casePrice,
                isDiscontinued: products.isDiscontinued,
                leadTime: products.leadTime,
            })
            .from(products)
            .where(where)
            .orderBy(asc(products.itemNumber))
            .limit(pageSize)
            .offset(offset),
        db.select({ total: count() }).from(products).where(where),
        db
            .select({
                total: count(),
                outOfStock: sql<number>`count(*) filter (where ${products.isDiscontinued} = false and ${products.qtyAvailable} <= 0)`,
                lowStock: sql<number>`count(*) filter (where ${products.isDiscontinued} = false and ${products.qtyAvailable} > 0 and ${products.minQty} > 0 and ${products.qtyAvailable} < ${products.minQty})`,
                inStock: sql<number>`count(*) filter (where ${products.isDiscontinued} = false and ${products.qtyAvailable} > 0 and (${products.minQty} = 0 or ${products.qtyAvailable} >= ${products.minQty}))`,
                discontinued: sql<number>`count(*) filter (where ${products.isDiscontinued} = true)`,
                incoming: sql<number>`count(*) filter (where ${products.upcomingShipmentQty} > 0)`,
                stockValue: sql<string>`coalesce(sum(${products.qtyInStock}::numeric * ${products.landedCost}), 0)`,
            })
            .from(products)
            .where(statsWhere),
    ]);

    return {
        rows,
        stats: {
            total: Number(statsRow?.total ?? 0),
            outOfStock: Number(statsRow?.outOfStock ?? 0),
            lowStock: Number(statsRow?.lowStock ?? 0),
            inStock: Number(statsRow?.inStock ?? 0),
            discontinued: Number(statsRow?.discontinued ?? 0),
            incoming: Number(statsRow?.incoming ?? 0),
            stockValue: Number(statsRow?.stockValue ?? 0),
        },
        page,
        pageSize,
        totalCount: Number(totalsRow?.total ?? 0),
        totalPages: Math.max(
            1,
            Math.ceil(Number(totalsRow?.total ?? 0) / pageSize),
        ),
    };
}

export type InventoryStatusRow = Awaited<
    ReturnType<typeof getInventoryStatusReport>
>['rows'][number];

/** Distinct units-sold-by values present in the products table. */
export async function getDistinctUnitsSoldBy(): Promise<string[]> {
    const rows = await db
        .selectDistinct({ unit: products.unitSoldBy })
        .from(products)
        .orderBy(asc(products.unitSoldBy));
    return rows.map((r) => r.unit).filter(Boolean);
}

// -----------------------------------------------------------------------------
// Item Invoice History Lookup
// -----------------------------------------------------------------------------

export type ItemInvoiceHistoryFilters = {
    itemNumber: string;
    startDate?: string;
    endDate?: string;
    customerNumber?: string;
    page?: number;
    pageSize?: number;
};

const ITEM_HISTORY_PAGE_SIZE = 50;

function resolveItemHistoryRange(filters: {
    startDate?: string;
    endDate?: string;
}) {
    const fallback = getPeriodRange('6m');
    return {
        startDate: filters.startDate ?? fallback.startDate,
        endDate: filters.endDate ?? fallback.endDate,
    };
}

export async function getItemInvoiceHistory(
    filters: ItemInvoiceHistoryFilters,
) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = filters.pageSize ?? ITEM_HISTORY_PAGE_SIZE;
    const offset = (page - 1) * pageSize;
    const { startDate, endDate } = resolveItemHistoryRange(filters);

    const conditions: SQL[] = [
        eq(invoiceItems.itemNumber, filters.itemNumber),
        gte(invoices.invoiceDate, startDate),
        lte(invoices.invoiceDate, endDate),
        ne(invoices.invoiceStatus, 'voided'),
    ];
    if (filters.customerNumber) {
        conditions.push(eq(invoices.customerNumber, filters.customerNumber));
    }
    const where = and(...conditions);

    // Deduped subquery: collapse duplicate (invoice, item) source rows by
    // summing qty / lineTotal, so downstream counts and totals are accurate.
    const dedupedItems = db
        .select({
            invoiceNumber: invoiceItems.invoiceNumber,
            itemNumber: invoiceItems.itemNumber,
            qtyOrdered: sql<number>`sum(${invoiceItems.qtyOrdered})::int`.as(
                'qty_ordered',
            ),
            qtyShipped: sql<number>`sum(${invoiceItems.qtyShipped})::int`.as(
                'qty_shipped',
            ),
            lineTotal: sql<string>`sum(${invoiceItems.lineTotal})`.as(
                'line_total',
            ),
            unitPrice: sql<string>`max(${invoiceItems.unitPrice})`.as(
                'unit_price',
            ),
            discount: sql<string>`max(${invoiceItems.discount})`.as('discount'),
        })
        .from(invoiceItems)
        .innerJoin(
            invoices,
            eq(invoiceItems.invoiceNumber, invoices.invoiceNumber),
        )
        .where(where)
        .groupBy(invoiceItems.invoiceNumber, invoiceItems.itemNumber)
        .as('deduped_items');

    const [product, rows, [totalsRow], [countRow]] = await Promise.all([
        db
            .select({
                itemNumber: products.itemNumber,
                description: products.description,
                productType: products.productType,
                unitSoldBy: products.unitSoldBy,
                qtyAvailable: products.qtyAvailable,
                qtyInStock: products.qtyInStock,
                isDiscontinued: products.isDiscontinued,
                casePrice: products.casePrice,
            })
            .from(products)
            .where(eq(products.itemNumber, filters.itemNumber))
            .limit(1),
        db
            .select({
                invoiceNumber: invoices.invoiceNumber,
                orderNumber: invoices.orderNumber,
                invoiceDate: invoices.invoiceDate,
                invoiceStatus: invoices.invoiceStatus,
                customerNumber: invoices.customerNumber,
                customerName: customers.customerName,
                territoryCode: invoices.territoryCode,
                salespersonCode: invoices.salespersonCode,
                unitPrice: dedupedItems.unitPrice,
                qtyOrdered: dedupedItems.qtyOrdered,
                qtyShipped: dedupedItems.qtyShipped,
                discount: dedupedItems.discount,
                lineTotal: dedupedItems.lineTotal,
            })
            .from(dedupedItems)
            .innerJoin(
                invoices,
                eq(dedupedItems.invoiceNumber, invoices.invoiceNumber),
            )
            .innerJoin(
                customers,
                eq(customers.customerNumber, invoices.customerNumber),
            )
            .orderBy(desc(invoices.invoiceDate), desc(invoices.invoiceNumber))
            .limit(pageSize)
            .offset(offset),
        db
            .select({
                invoiceCount: countDistinct(invoices.invoiceNumber),
                customerCount: countDistinct(invoices.customerNumber),
                totalQty: sql<number>`coalesce(sum(${dedupedItems.qtyShipped}), 0)`,
                totalAmount: sql<string>`coalesce(sum(${dedupedItems.lineTotal}), 0)`,
                avgPrice: sql<string>`case when coalesce(sum(${dedupedItems.qtyShipped}), 0) = 0 then 0 else coalesce(sum(${dedupedItems.lineTotal}), 0) / sum(${dedupedItems.qtyShipped}) end`,
                lastSale: sql<string | null>`max(${invoices.invoiceDate})`,
            })
            .from(dedupedItems)
            .innerJoin(
                invoices,
                eq(dedupedItems.invoiceNumber, invoices.invoiceNumber),
            ),
        db.select({ total: count() }).from(dedupedItems),
    ]);

    return {
        product: product[0] ?? null,
        periodRange: { startDate, endDate },
        rows,
        stats: {
            invoiceCount: Number(totalsRow?.invoiceCount ?? 0),
            customerCount: Number(totalsRow?.customerCount ?? 0),
            totalQty: Number(totalsRow?.totalQty ?? 0),
            totalAmount: Number(totalsRow?.totalAmount ?? 0),
            avgPrice: Number(totalsRow?.avgPrice ?? 0),
            lastSale: totalsRow?.lastSale ?? null,
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

export type ItemInvoiceHistoryRow = Awaited<
    ReturnType<typeof getItemInvoiceHistory>
>['rows'][number];
