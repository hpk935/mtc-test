// Customer credit: the negative balance left on an invoice by an overpayment.
// Everything that decides what counts as credit, how much is available, and
// how it's drawn and given back lives here.
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import db from '@/lib/db';
import { roundCents } from '@/lib/utils';
import { orders } from '@/features/orders/schema';
import { invoices, payments } from './schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** A customer's invoices that hold credit: overpaid and not voided. */
function creditInvoicesOf(customerNumber: string) {
    return and(
        eq(invoices.customerNumber, customerNumber),
        ne(invoices.invoiceStatus, 'voided'),
        sql`${invoices.balanceDue} < 0`,
    );
}

/**
 * Credit a customer can still spend: their overpaid invoices, less credit
 * already applied to open orders that aren't invoiced yet. Pass the order
 * being edited so its own credit counts as available.
 */
export async function getCustomerAvailableCredit(
    customerNumber: string,
    excludeOrderNumber?: string,
): Promise<number> {
    const [[credit], [reserved]] = await Promise.all([
        db
            .select({
                total: sql<string>`coalesce(sum(-${invoices.balanceDue}), 0)`,
            })
            .from(invoices)
            .where(creditInvoicesOf(customerNumber)),
        db
            .select({
                total: sql<string>`coalesce(sum(${orders.creditAmount}), 0)`,
            })
            .from(orders)
            .where(
                and(
                    eq(orders.customerNumber, customerNumber),
                    eq(orders.orderStatus, 'open'),
                    excludeOrderNumber
                        ? ne(orders.orderNumber, excludeOrderNumber)
                        : undefined,
                ),
            ),
    ]);
    return Math.max(
        0,
        roundCents(Number(credit.total) - Number(reserved.total)),
    );
}

/**
 * Moves `change` dollars into an invoice's amount paid (or out of it, when
 * negative), with the balance due moving the opposite way.
 */
async function changeAmountPaid(tx: Tx, invoiceNumber: string, change: number) {
    const amount = change.toFixed(2);
    await tx
        .update(invoices)
        .set({
            amountPaid: sql`${invoices.amountPaid} + ${amount}`,
            balanceDue: sql`${invoices.balanceDue} - ${amount}`,
            updatedAt: new Date(),
        })
        .where(eq(invoices.invoiceNumber, invoiceNumber));
}

/**
 * Draws `amount` of a customer's credit (oldest overpaid invoice first) for
 * the invoice `usedBy`. Each draw is a negative payment row on the credit
 * invoice, so its balance moves back toward $0 and the as-of-date aging still
 * lines up. Throws if the customer no longer has enough credit.
 */
export async function drawCustomerCredit(
    tx: Tx,
    draw: {
        customerNumber: string;
        amount: number;
        usedBy: string;
        date: string;
    },
) {
    let remaining = roundCents(draw.amount);
    if (remaining <= 0) return;

    const credits = await tx
        .select({
            invoiceNumber: invoices.invoiceNumber,
            balanceDue: invoices.balanceDue,
        })
        .from(invoices)
        .where(creditInvoicesOf(draw.customerNumber))
        .orderBy(asc(invoices.invoiceDate), asc(invoices.invoiceNumber))
        .for('update');

    for (const credit of credits) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, -Number(credit.balanceDue));
        await tx.insert(payments).values({
            invoiceNumber: credit.invoiceNumber,
            amount: (-take).toFixed(2),
            paymentDate: draw.date,
            paymentRef: `Credit used on invoice ${draw.usedBy}`,
            appliedToInvoiceNumber: draw.usedBy,
        });
        await changeAmountPaid(tx, credit.invoiceNumber, -take);
        remaining = roundCents(remaining - take);
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
        // A draw is a negative payment; deleting it puts the money back.
        await changeAmountPaid(tx, draw.invoiceNumber, -Number(draw.amount));
    }
}
