import { eq, sql } from 'drizzle-orm';
import db from '@/lib/db';
import { invoices, payments } from './schema';
import type { InvoiceStatus } from './constants';
import type { ActionResult } from '@/types';

const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
    open: ['paid', 'voided'],
    partially_paid: ['paid', 'voided'],
    paid: ['open', 'voided'],
    voided: [],
};

export async function updateInvoiceStatusRecord(
    invoiceNumber: string,
    newStatus: InvoiceStatus,
): Promise<ActionResult> {
    const [invoice] = await db
        .select({
            invoiceNumber: invoices.invoiceNumber,
            invoiceStatus: invoices.invoiceStatus,
            totalAmount: invoices.totalAmount,
        })
        .from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceNumber))
        .limit(1);

    if (!invoice) {
        return { success: false, error: 'Invoice not found.' };
    }

    // Prevent undoing a paid status when payments exist
    if (invoice.invoiceStatus === 'paid') {
        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(payments)
            .where(eq(payments.invoiceNumber, invoiceNumber));
        if (count > 0) {
            return {
                success: false,
                error: 'Cannot change status of a fully paid invoice with payment records.',
            };
        }
    }

    const current = invoice.invoiceStatus;

    if (current === newStatus) {
        return { success: false, error: `Invoice is already ${newStatus}.` };
    }

    const allowed = VALID_TRANSITIONS[current];
    if (!allowed.includes(newStatus)) {
        return {
            success: false,
            error: `Cannot change status from "${current}" to "${newStatus}".`,
        };
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const updateData: Record<string, unknown> = {
        invoiceStatus: newStatus,
        updatedAt: now,
    };

    if (newStatus === 'paid') {
        updateData.amountPaid = invoice.totalAmount;
        updateData.balanceDue = '0';
        updateData.paidDate = today;
    } else if (newStatus === 'voided') {
        updateData.balanceDue = '0';
    } else if (newStatus === 'open') {
        updateData.amountPaid = '0';
        updateData.balanceDue = invoice.totalAmount;
        updateData.paidDate = null;
    }

    await db
        .update(invoices)
        .set(updateData)
        .where(eq(invoices.invoiceNumber, invoiceNumber));

    return { success: true, data: undefined };
}

export async function applyPaymentRecord(
    invoiceNumber: string,
    paymentAmount: number,
    paymentDate: string,
    paymentRef?: string,
): Promise<ActionResult> {
    const [invoice] = await db
        .select({
            invoiceNumber: invoices.invoiceNumber,
            invoiceStatus: invoices.invoiceStatus,
            totalAmount: invoices.totalAmount,
        })
        .from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceNumber))
        .limit(1);

    if (!invoice) {
        return { success: false, error: 'Invoice not found.' };
    }

    if (
        invoice.invoiceStatus !== 'open' &&
        invoice.invoiceStatus !== 'partially_paid'
    ) {
        return {
            success: false,
            error: `Cannot apply payment to a ${invoice.invoiceStatus} invoice.`,
        };
    }

    const total = parseFloat(invoice.totalAmount);

    await db.transaction(async (tx) => {
        // 1. Insert payment record
        await tx.insert(payments).values({
            invoiceNumber,
            amount: paymentAmount.toFixed(2),
            paymentDate,
            paymentRef: paymentRef || null,
        });

        // 2. Recalculate invoice totals from all payments
        const [{ totalPaid }] = await tx
            .select({
                totalPaid: sql<string>`coalesce(sum(${payments.amount}), 0)`,
            })
            .from(payments)
            .where(eq(payments.invoiceNumber, invoiceNumber));

        const newAmountPaid = Math.min(parseFloat(totalPaid), total);
        const newBalanceDue = Math.max(0, total - newAmountPaid);
        const fullyPaid = newBalanceDue === 0;

        await tx
            .update(invoices)
            .set({
                amountPaid: newAmountPaid.toFixed(2),
                balanceDue: newBalanceDue.toFixed(2),
                invoiceStatus: fullyPaid ? 'paid' : 'partially_paid',
                paidDate: fullyPaid ? paymentDate : null,
                updatedAt: new Date(),
            })
            .where(eq(invoices.invoiceNumber, invoiceNumber));
    });

    return { success: true, data: undefined };
}
