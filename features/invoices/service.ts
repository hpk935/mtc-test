import { eq } from 'drizzle-orm';
import db from '@/lib/db';
import { invoices, accountReceivables } from './schema';
import type { InvoiceStatus } from './constants';
import type { ActionResult } from '@/types';

const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
    posted: ['paid', 'voided'],
    paid: ['posted', 'voided'],
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
        })
        .from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceNumber))
        .limit(1);

    if (!invoice) {
        return { success: false, error: 'Invoice not found.' };
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

    await db.transaction(async (tx) => {
        await tx
            .update(invoices)
            .set({ invoiceStatus: newStatus, updatedAt: now })
            .where(eq(invoices.invoiceNumber, invoiceNumber));

        // Sync account receivable payment status
        if (newStatus === 'paid') {
            await tx
                .update(accountReceivables)
                .set({
                    paymentStatus: 'paid',
                    paidDate: now.toISOString().split('T')[0],
                    balanceDue: '0',
                    updatedAt: now,
                })
                .where(eq(accountReceivables.invoiceNumber, invoiceNumber));
        } else if (newStatus === 'voided') {
            await tx
                .update(accountReceivables)
                .set({
                    paymentStatus: 'voided',
                    balanceDue: '0',
                    updatedAt: now,
                })
                .where(eq(accountReceivables.invoiceNumber, invoiceNumber));
        } else if (newStatus === 'posted') {
            // Reverting from paid back to posted — reopen the receivable
            const [ar] = await tx
                .select({
                    invoiceTotalAmount: accountReceivables.invoiceTotalAmount,
                })
                .from(accountReceivables)
                .where(eq(accountReceivables.invoiceNumber, invoiceNumber))
                .limit(1);

            if (ar) {
                await tx
                    .update(accountReceivables)
                    .set({
                        paymentStatus: 'open',
                        paidDate: null,
                        balanceDue: ar.invoiceTotalAmount,
                        updatedAt: now,
                    })
                    .where(eq(accountReceivables.invoiceNumber, invoiceNumber));
            }
        }
    });

    return { success: true, data: undefined };
}
