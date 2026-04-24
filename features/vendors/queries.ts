import {
    and,
    asc,
    count,
    desc,
    eq,
    ilike,
    inArray,
    or,
    sql,
    type SQL,
} from 'drizzle-orm';
import db from '@/lib/db';
import { products } from '@/features/products/schema';
import { users } from '@/features/users/schema';
import { purchaseOrderItems, purchaseOrders, vendors } from './schema';
import type { PurchaseOrderStatus, VendorType } from './constants';

const PAGE_SIZE_DEFAULT = 20;

// ---- Vendors ----

export async function getVendors({
    search,
    isActive,
    vendorType,
    page = 1,
    pageSize = PAGE_SIZE_DEFAULT,
}: {
    search?: string;
    isActive?: boolean;
    vendorType?: VendorType;
    page?: number;
    pageSize?: number;
} = {}) {
    const offset = (page - 1) * pageSize;
    const conditions: SQL[] = [];

    if (isActive !== undefined) {
        conditions.push(eq(vendors.isActive, isActive));
    }
    if (vendorType) {
        conditions.push(eq(vendors.vendorType, vendorType));
    }
    if (search) {
        const term = `%${search.trim()}%`;
        conditions.push(
            or(
                ilike(vendors.vendorCode, term),
                ilike(vendors.name, term),
                ilike(vendors.contactName, term),
                ilike(vendors.city, term),
            )!,
        );
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [rows, [{ total }]] = await Promise.all([
        db
            .select({
                id: vendors.id,
                vendorCode: vendors.vendorCode,
                name: vendors.name,
                vendorType: vendors.vendorType,
                contactName: vendors.contactName,
                phone: vendors.phone,
                city: vendors.city,
                state: vendors.state,
                isActive: vendors.isActive,
            })
            .from(vendors)
            .where(whereClause)
            .orderBy(asc(vendors.vendorCode))
            .limit(pageSize)
            .offset(offset),
        db.select({ total: count() }).from(vendors).where(whereClause),
    ]);

    return {
        vendors: rows,
        totalCount: total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
}

export type VendorListItem = Awaited<
    ReturnType<typeof getVendors>
>['vendors'][number];

export async function findVendorById(id: number) {
    const [row] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, id))
        .limit(1);
    return row ?? null;
}

export async function findVendorByCode(vendorCode: string) {
    const [row] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.vendorCode, vendorCode))
        .limit(1);
    return row ?? null;
}

/** Active vendors for use in select dropdowns. */
export async function getActiveVendorsForSelect() {
    return db
        .select({
            id: vendors.id,
            vendorCode: vendors.vendorCode,
            name: vendors.name,
        })
        .from(vendors)
        .where(eq(vendors.isActive, true))
        .orderBy(asc(vendors.name));
}

// ---- Purchase Orders ----

export async function getPurchaseOrders({
    vendorId,
    status,
    page = 1,
    pageSize = PAGE_SIZE_DEFAULT,
}: {
    vendorId?: number;
    status?: PurchaseOrderStatus;
    page?: number;
    pageSize?: number;
} = {}) {
    const offset = (page - 1) * pageSize;
    const conditions: SQL[] = [];
    if (vendorId) conditions.push(eq(purchaseOrders.vendorId, vendorId));
    if (status) conditions.push(eq(purchaseOrders.status, status));
    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [rows, [{ total }]] = await Promise.all([
        db
            .select({
                id: purchaseOrders.id,
                poNumber: purchaseOrders.poNumber,
                status: purchaseOrders.status,
                orderDate: purchaseOrders.orderDate,
                expectedDate: purchaseOrders.expectedDate,
                receivedDate: purchaseOrders.receivedDate,
                totalAmount: purchaseOrders.totalAmount,
                vendorId: vendors.id,
                vendorCode: vendors.vendorCode,
                vendorName: vendors.name,
            })
            .from(purchaseOrders)
            .innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
            .where(whereClause)
            .orderBy(desc(purchaseOrders.orderDate), desc(purchaseOrders.id))
            .limit(pageSize)
            .offset(offset),
        db.select({ total: count() }).from(purchaseOrders).where(whereClause),
    ]);

    return {
        purchaseOrders: rows,
        totalCount: total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
}

export type PurchaseOrderListItem = Awaited<
    ReturnType<typeof getPurchaseOrders>
>['purchaseOrders'][number];

export async function findPurchaseOrderById(id: number) {
    const [po] = await db
        .select({
            id: purchaseOrders.id,
            poNumber: purchaseOrders.poNumber,
            vendorId: purchaseOrders.vendorId,
            status: purchaseOrders.status,
            orderDate: purchaseOrders.orderDate,
            expectedDate: purchaseOrders.expectedDate,
            receivedDate: purchaseOrders.receivedDate,
            subtotalAmount: purchaseOrders.subtotalAmount,
            freightAmount: purchaseOrders.freightAmount,
            totalAmount: purchaseOrders.totalAmount,
            notes: purchaseOrders.notes,
            createdBy: purchaseOrders.createdBy,
            createdAt: purchaseOrders.createdAt,
            updatedAt: purchaseOrders.updatedAt,
            vendorCode: vendors.vendorCode,
            vendorName: vendors.name,
            creatorName: users.firstName,
        })
        .from(purchaseOrders)
        .innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
        .leftJoin(users, eq(purchaseOrders.createdBy, users.employeeId))
        .where(eq(purchaseOrders.id, id))
        .limit(1);

    if (!po) return null;

    const items = await db
        .select({
            id: purchaseOrderItems.id,
            productId: purchaseOrderItems.productId,
            itemNumber: purchaseOrderItems.itemNumber,
            description: purchaseOrderItems.description,
            qtyOrdered: purchaseOrderItems.qtyOrdered,
            qtyReceived: purchaseOrderItems.qtyReceived,
            unitCost: purchaseOrderItems.unitCost,
            lineTotal: purchaseOrderItems.lineTotal,
        })
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, id))
        .orderBy(asc(purchaseOrderItems.id));

    return { ...po, items };
}

export type PurchaseOrderDetail = NonNullable<
    Awaited<ReturnType<typeof findPurchaseOrderById>>
>;

/**
 * For each productId, returns the earliest open PO line (ordered or
 * partially_received) with remaining qty > 0. Used by the product detail
 * page and reports to display "next upcoming shipment".
 */
export async function getUpcomingShipmentsByProductIds(productIds: number[]) {
    if (productIds.length === 0) return [];

    const rows = await db
        .select({
            productId: purchaseOrderItems.productId,
            poNumber: purchaseOrders.poNumber,
            expectedDate: purchaseOrders.expectedDate,
            qtyRemaining:
                sql<number>`(${purchaseOrderItems.qtyOrdered} - ${purchaseOrderItems.qtyReceived})::int`.as(
                    'qty_remaining',
                ),
        })
        .from(purchaseOrderItems)
        .innerJoin(
            purchaseOrders,
            eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id),
        )
        .where(
            and(
                inArray(purchaseOrderItems.productId, productIds),
                inArray(purchaseOrders.status, [
                    'ordered',
                    'partially_received',
                ]),
                sql`${purchaseOrderItems.qtyOrdered} > ${purchaseOrderItems.qtyReceived}`,
            ),
        )
        .orderBy(
            asc(purchaseOrders.expectedDate),
            asc(purchaseOrders.orderDate),
        );

    // First row per productId wins (earliest expectedDate, then orderDate).
    const byProduct = new Map<number, (typeof rows)[number]>();
    for (const r of rows) {
        if (!byProduct.has(r.productId)) byProduct.set(r.productId, r);
    }
    return Array.from(byProduct.values());
}

/** Open PO lines (with product) for a specific product — used on product page. */
export async function getOpenPurchaseOrdersForProduct(productId: number) {
    return db
        .select({
            lineId: purchaseOrderItems.id,
            purchaseOrderId: purchaseOrders.id,
            poNumber: purchaseOrders.poNumber,
            status: purchaseOrders.status,
            orderDate: purchaseOrders.orderDate,
            expectedDate: purchaseOrders.expectedDate,
            qtyOrdered: purchaseOrderItems.qtyOrdered,
            qtyReceived: purchaseOrderItems.qtyReceived,
            unitCost: purchaseOrderItems.unitCost,
            vendorCode: vendors.vendorCode,
            vendorName: vendors.name,
        })
        .from(purchaseOrderItems)
        .innerJoin(
            purchaseOrders,
            eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id),
        )
        .innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
        .where(
            and(
                eq(purchaseOrderItems.productId, productId),
                inArray(purchaseOrders.status, [
                    'ordered',
                    'partially_received',
                ]),
            ),
        )
        .orderBy(asc(purchaseOrders.expectedDate));
}
