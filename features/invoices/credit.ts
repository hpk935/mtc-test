import { and, asc, eq, ne, sql } from 'drizzle-orm';
import db from '@/lib/db';
import { invoices, payments } from './schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const toCents = (n: number) => Math.round(n * 100) / 100;

/**
 * Draws `amount` of customer credit (negative-balance invoices, oldest
 * first) for the invoice `usedBy`. Each draw is a negative payment row on the
 * credit invoice, so its balance moves back toward $0 and the as-of-date
 * aging still lines up. Throws if the customer no longer has enough credit.
 */
export async function useCustomerCredit(
    tx: Tx,
    customerNumber: string,
    amount: number,
    usedBy: string,
    date: string,
) {
    let remaining = toCents(amount);
    if (remaining <= 0) return;

    const credits = await tx
        .select({
            invoiceNumber: invoices.invoiceNumber,
            balanceDue: invoices.balanceDue,
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.customerNumber, customerNumber),
                ne(invoices.invoiceStatus, 'voided'),
                sql`${invoices.balanceDue} < 0`,
            ),
        )
        .orderBy(asc(invoices.invoiceDate), asc(invoices.invoiceNumber))
        .for('update');

    for (const credit of credits) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, -Number(credit.balanceDue));
        await tx.insert(payments).values({
            invoiceNumber: credit.invoiceNumber,
            amount: (-take).toFixed(2),
            paymentDate: date,
            paymentRef: `Credit used on invoice ${usedBy}`,
            appliedToInvoiceNumber: usedBy,
        });
        await tx
            .update(invoices)
            .set({
                amountPaid: sql`${invoices.amountPaid} - ${take.toFixed(2)}`,
                balanceDue: sql`${invoices.balanceDue} + ${take.toFixed(2)}`,
                updatedAt: new Date(),
            })
            .where(eq(invoices.invoiceNumber, credit.invoiceNumber));
        remaining = toCents(remaining - take);
    }

    if (remaining > 0) {
        throw new Error('The customer no longer has enough credit available.');
    }
}

/**
 * Undoes every credit draw made for `usedBy` (when that invoice is voided),
 * returning the credit to the invoices it came from.
 */
export async function restoreCustomerCredit(tx: Tx, usedBy: string) {
    const draws = await tx
        .delete(payments)
        .where(eq(payments.appliedToInvoiceNumber, usedBy))
        .returning({
            invoiceNumber: payments.invoiceNumber,
            amount: payments.amount,
        });

    for (const draw of draws) {
        await tx
            .update(invoices)
            .set({
                amountPaid: sql`${invoices.amountPaid} - ${draw.amount}`,
                balanceDue: sql`${invoices.balanceDue} + ${draw.amount}`,
                updatedAt: new Date(),
            })
            .where(eq(invoices.invoiceNumber, draw.invoiceNumber));
    }
}
