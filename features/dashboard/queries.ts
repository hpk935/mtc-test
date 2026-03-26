import { count, eq, desc } from 'drizzle-orm';
import db from '@/lib/db';
import { orders } from '@/features/orders/schema';
import { invoices } from '@/features/invoices/schema';
import { customers } from '@/features/customers/schema';

export async function getDashboardStats() {
    const [[{ totalOrders }], [{ pendingInvoices }], [{ totalCustomers }]] =
        await Promise.all([
            db.select({ totalOrders: count() }).from(orders),
            db
                .select({ pendingInvoices: count() })
                .from(invoices)
                .where(eq(invoices.invoiceStatus, 'open')),
            db.select({ totalCustomers: count() }).from(customers),
        ]);

    return { totalOrders, pendingInvoices, totalCustomers };
}

export async function getRecentOrders(limit = 5) {
    return db
        .select({
            orderNumber: orders.orderNumber,
            customerNumber: orders.customerNumber,
            orderDate: orders.orderDate,
            totalAmount: orders.totalAmount,
            orderStatus: orders.orderStatus,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(limit);
}

export async function getRecentInvoices(limit = 5) {
    return db
        .select({
            invoiceNumber: invoices.invoiceNumber,
            customerNumber: invoices.customerNumber,
            invoiceDate: invoices.invoiceDate,
            totalAmount: invoices.totalAmount,
            invoiceStatus: invoices.invoiceStatus,
        })
        .from(invoices)
        .orderBy(desc(invoices.createdAt))
        .limit(limit);
}
