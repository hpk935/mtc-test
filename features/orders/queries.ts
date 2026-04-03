import { ilike, or, and, count, desc, eq, asc, sql } from 'drizzle-orm';
import db from '@/lib/db';
import { orders, orderItems } from './schema';
import { customers } from '@/features/customers/schema';
import { products } from '@/features/products/schema';
import { users } from '@/features/users/schema';
import type { OrderStatus } from './constants';

const PAGE_SIZE_DEFAULT = 20;

export async function getOrders({
    search,
    status,
    page = 1,
    pageSize = PAGE_SIZE_DEFAULT,
}: {
    search?: string;
    status?: OrderStatus;
    page?: number;
    pageSize?: number;
} = {}) {
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (status) {
        conditions.push(eq(orders.orderStatus, status));
    }

    if (search) {
        conditions.push(
            or(
                ilike(orders.orderNumber, `%${search}%`),
                ilike(customers.customerName, `%${search}%`),
                ilike(orders.customerPoReference, `%${search}%`),
                ilike(orders.shipToName, `%${search}%`),
            )!,
        );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
        db
            .select({
                orderNumber: orders.orderNumber,
                customerNumber: orders.customerNumber,
                customerName: customers.customerName,
                orderDate: orders.orderDate,
                shipToName: orders.shipToName,
                shipToCity: orders.shipToCity,
                shipToStateCode: orders.shipToStateCode,
                totalAmount: orders.totalAmount,
                orderStatus: orders.orderStatus,
            })
            .from(orders)
            .leftJoin(
                customers,
                eq(orders.customerNumber, customers.customerNumber),
            )
            .where(whereClause)
            .orderBy(desc(orders.orderDate))
            .limit(pageSize)
            .offset(offset),
        db
            .select({ total: count() })
            .from(orders)
            .leftJoin(
                customers,
                eq(orders.customerNumber, customers.customerNumber),
            )
            .where(whereClause),
    ]);

    return {
        orders: data,
        totalCount: total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

export type OrderListItem = Awaited<
    ReturnType<typeof getOrders>
>['orders'][number];

export async function findOrderByNumber(orderNumber: string) {
    const [order] = await db
        .select({
            orderNumber: orders.orderNumber,
            customerNumber: orders.customerNumber,
            customerName: customers.customerName,
            salespersonCode: orders.salespersonCode,
            salespersonFirstName: users.firstName,
            salespersonLastName: users.lastName,
            orderDate: orders.orderDate,
            customerPoReference: orders.customerPoReference,
            freightTerm: orders.freightTerm,
            shipToName: orders.shipToName,
            shipToAddress1: orders.shipToAddress1,
            shipToAddress2: orders.shipToAddress2,
            shipToCity: orders.shipToCity,
            shipToStateCode: orders.shipToStateCode,
            shipToPostalCode: orders.shipToPostalCode,
            termCode: orders.termCode,
            territoryCode: orders.territoryCode,
            salesTaxAmount: orders.salesTaxAmount,
            subtotalAmount: orders.subtotalAmount,
            freightAmount: orders.freightAmount,
            totalAmount: orders.totalAmount,
            costAmount: orders.costAmount,
            orderStatus: orders.orderStatus,
            shippingNote: orders.shippingNote,
            createdAt: orders.createdAt,
        })
        .from(orders)
        .leftJoin(
            customers,
            eq(orders.customerNumber, customers.customerNumber),
        )
        .leftJoin(users, eq(orders.salespersonCode, users.employeeId))
        .where(eq(orders.orderNumber, orderNumber))
        .limit(1);
    return order ?? null;
}

export type OrderDetail = NonNullable<
    Awaited<ReturnType<typeof findOrderByNumber>>
>;

const ITEMS_PAGE_SIZE = 20;

export async function getOrderItems({
    orderNumber,
    page = 1,
    pageSize = ITEMS_PAGE_SIZE,
}: {
    orderNumber: string;
    page?: number;
    pageSize?: number;
}) {
    const offset = (page - 1) * pageSize;
    const where = eq(orderItems.orderNumber, orderNumber);

    const [data, [{ total }]] = await Promise.all([
        db
            .select({
                id: orderItems.id,
                itemNumber: orderItems.itemNumber,
                description: products.description,
                unitPrice: orderItems.unitPrice,
                qtyOrdered: orderItems.qtyOrdered,
                qtyShipped: orderItems.qtyShipped,
                discount: orderItems.discount,
                lineTotal: orderItems.lineTotal,
                invoiceNumber: orderItems.invoiceNumber,
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.itemNumber, products.itemNumber))
            .where(where)
            .orderBy(asc(orderItems.id))
            .limit(pageSize)
            .offset(offset),
        db.select({ total: count() }).from(orderItems).where(where),
    ]);

    return {
        items: data,
        totalCount: total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

export type OrderItemDetail = Awaited<
    ReturnType<typeof getOrderItems>
>['items'][number];

export async function getMaxOrderNumber(): Promise<number> {
    const [result] = await db
        .select({
            maxNum: sql<number>`coalesce(max(cast(${orders.orderNumber} as integer)), 0)`,
        })
        .from(orders)
        .where(sql`${orders.orderNumber} ~ '^[0-9]+$'`);
    return result?.maxNum ?? 0;
}

export async function getOrderForEdit(orderNumber: string) {
    const [row] = await db
        .select({
            order: orders,
            customerName: customers.customerName,
        })
        .from(orders)
        .leftJoin(
            customers,
            eq(orders.customerNumber, customers.customerNumber),
        )
        .where(eq(orders.orderNumber, orderNumber))
        .limit(1);

    if (!row) return null;

    const items = await db
        .select({
            itemNumber: orderItems.itemNumber,
            description: products.description,
            qtyOrdered: orderItems.qtyOrdered,
            unitPrice: orderItems.unitPrice,
            discount: orderItems.discount,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.itemNumber, products.itemNumber))
        .where(eq(orderItems.orderNumber, orderNumber))
        .orderBy(asc(orderItems.id));

    return { order: row.order, customerName: row.customerName, items };
}

export type OrderForEdit = NonNullable<
    Awaited<ReturnType<typeof getOrderForEdit>>
>;
