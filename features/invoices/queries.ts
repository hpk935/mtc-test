import { ilike, or, and, count, desc, eq, asc } from 'drizzle-orm';
import db from '@/lib/db';
import { invoices, payments } from './schema';
import { customers } from '@/features/customers/schema';
import { orderItems } from '@/features/orders/schema';
import { products } from '@/features/products/schema';
import { users } from '@/features/users/schema';
import type { InvoiceStatus } from './constants';

const PAGE_SIZE_DEFAULT = 20;

export async function getInvoices({
    search,
    status,
    page = 1,
    pageSize = PAGE_SIZE_DEFAULT,
}: {
    search?: string;
    status?: InvoiceStatus;
    page?: number;
    pageSize?: number;
} = {}) {
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (status) {
        conditions.push(eq(invoices.invoiceStatus, status));
    }

    if (search) {
        conditions.push(
            or(
                ilike(invoices.invoiceNumber, `%${search}%`),
                ilike(invoices.orderNumber, `%${search}%`),
                ilike(customers.customerName, `%${search}%`),
                ilike(invoices.customerPoReference, `%${search}%`),
            )!,
        );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
        db
            .select({
                invoiceNumber: invoices.invoiceNumber,
                orderNumber: invoices.orderNumber,
                customerNumber: invoices.customerNumber,
                customerName: customers.customerName,
                invoiceDate: invoices.invoiceDate,
                totalAmount: invoices.totalAmount,
                balanceDue: invoices.balanceDue,
                invoiceStatus: invoices.invoiceStatus,
            })
            .from(invoices)
            .leftJoin(
                customers,
                eq(invoices.customerNumber, customers.customerNumber),
            )
            .where(whereClause)
            .orderBy(desc(invoices.invoiceDate))
            .limit(pageSize)
            .offset(offset),
        db
            .select({ total: count() })
            .from(invoices)
            .leftJoin(
                customers,
                eq(invoices.customerNumber, customers.customerNumber),
            )
            .where(whereClause),
    ]);

    return {
        invoices: data,
        totalCount: total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

export type InvoiceListItem = Awaited<
    ReturnType<typeof getInvoices>
>['invoices'][number];

export async function getInvoicesByCustomer(
    customerNumber: string,
    { page = 1, pageSize = 10 }: { page?: number; pageSize?: number } = {},
) {
    const offset = (page - 1) * pageSize;
    const where = eq(invoices.customerNumber, customerNumber);

    const [data, [{ total }]] = await Promise.all([
        db
            .select({
                invoiceNumber: invoices.invoiceNumber,
                invoiceDate: invoices.invoiceDate,
                totalAmount: invoices.totalAmount,
                balanceDue: invoices.balanceDue,
                invoiceStatus: invoices.invoiceStatus,
            })
            .from(invoices)
            .where(where)
            .orderBy(desc(invoices.invoiceDate))
            .limit(pageSize)
            .offset(offset),
        db.select({ total: count() }).from(invoices).where(where),
    ]);

    return {
        invoices: data,
        totalCount: total,
        totalPages: Math.ceil(total / pageSize),
    };
}

export type CustomerInvoiceItem = Awaited<
    ReturnType<typeof getInvoicesByCustomer>
>['invoices'][number];

export async function findInvoiceByNumber(invoiceNumber: string) {
    const [invoice] = await db
        .select({
            invoiceNumber: invoices.invoiceNumber,
            orderNumber: invoices.orderNumber,
            customerNumber: invoices.customerNumber,
            customerName: customers.customerName,
            salespersonCode: invoices.salespersonCode,
            salespersonFirstName: users.firstName,
            salespersonLastName: users.lastName,
            invoiceDate: invoices.invoiceDate,
            customerPoReference: invoices.customerPoReference,
            freightTerm: invoices.freightTerm,
            shipToName: invoices.shipToName,
            shipToAddress1: invoices.shipToAddress1,
            shipToAddress2: invoices.shipToAddress2,
            shipToCity: invoices.shipToCity,
            shipToStateCode: invoices.shipToStateCode,
            shipToPostalCode: invoices.shipToPostalCode,
            termCode: invoices.termCode,
            territoryCode: invoices.territoryCode,
            salesTaxAmount: invoices.salesTaxAmount,
            subtotalAmount: invoices.subtotalAmount,
            freightAmount: invoices.freightAmount,
            totalAmount: invoices.totalAmount,
            costAmount: invoices.costAmount,
            invoiceStatus: invoices.invoiceStatus,
            dueDate: invoices.dueDate,
            amountPaid: invoices.amountPaid,
            balanceDue: invoices.balanceDue,
            paidDate: invoices.paidDate,
            paymentRef: invoices.paymentRef,
            shippingNote: invoices.shippingNote,
            createdAt: invoices.createdAt,
        })
        .from(invoices)
        .leftJoin(
            customers,
            eq(invoices.customerNumber, customers.customerNumber),
        )
        .leftJoin(users, eq(invoices.salespersonCode, users.employeeId))
        .where(eq(invoices.invoiceNumber, invoiceNumber))
        .limit(1);
    return invoice ?? null;
}

export type InvoiceDetail = NonNullable<
    Awaited<ReturnType<typeof findInvoiceByNumber>>
>;

const ITEMS_PAGE_SIZE = 20;

export async function getInvoiceItems({
    invoiceNumber,
    page = 1,
    pageSize = ITEMS_PAGE_SIZE,
}: {
    invoiceNumber: string;
    page?: number;
    pageSize?: number;
}) {
    const offset = (page - 1) * pageSize;
    const where = eq(orderItems.invoiceNumber, invoiceNumber);

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

export type InvoiceItemDetail = Awaited<
    ReturnType<typeof getInvoiceItems>
>['items'][number];

export async function getPaymentsByInvoice(invoiceNumber: string) {
    return db
        .select({
            id: payments.id,
            amount: payments.amount,
            paymentDate: payments.paymentDate,
            paymentRef: payments.paymentRef,
            createdAt: payments.createdAt,
        })
        .from(payments)
        .where(eq(payments.invoiceNumber, invoiceNumber))
        .orderBy(desc(payments.paymentDate), desc(payments.id));
}

export type PaymentRecord = Awaited<
    ReturnType<typeof getPaymentsByInvoice>
>[number];
