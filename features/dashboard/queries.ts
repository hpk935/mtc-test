import { count, eq, desc } from 'drizzle-orm';
import db from '@/lib/db';
import { orders } from '@/features/orders/schema';
import { invoices } from '@/features/invoices/schema';
import { customers } from '@/features/customers/schema';
import { products } from '@/features/products/schema';

export async function getDashboardStats() {
    const [
        [{ openOrders }],
        [{ invoicedCount }],
        [{ totalCustomers }],
        [{ totalProducts }],
    ] = await Promise.all([
        db
            .select({ openOrders: count() })
            .from(orders)
            .where(eq(orders.orderStatus, 'open')),
        db
            .select({ invoicedCount: count() })
            .from(invoices)
            .where(eq(invoices.invoiceStatus, 'open')),
        db.select({ totalCustomers: count() }).from(customers),
        db
            .select({ totalProducts: count() })
            .from(products)
            .where(eq(products.isDiscontinued, false)),
    ]);

    return { openOrders, invoicedCount, totalCustomers, totalProducts };
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
        .orderBy(desc(orders.orderDate))
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
        .orderBy(desc(invoices.invoiceDate))
        .limit(limit);
}
