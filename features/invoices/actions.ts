'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { updateInvoiceStatusSchema, applyPaymentSchema } from './validation';
import { updateInvoiceStatusRecord, applyPaymentRecord } from './service';
import type { ActionResult } from '@/types';

export async function updateInvoiceStatus(
    invoiceNumber: string,
    newStatus: string,
): Promise<ActionResult> {
    await requireAdmin();

    const parsed = updateInvoiceStatusSchema.safeParse({
        invoiceNumber,
        status: newStatus,
    });

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return {
            success: false,
            error: firstError ?? 'Invalid status.',
        };
    }

    const result = await updateInvoiceStatusRecord(
        parsed.data.invoiceNumber,
        parsed.data.status,
    );

    if (result.success) {
        revalidatePath(`/invoices/${invoiceNumber}`);
        revalidatePath('/invoices');
    }

    return result;
}

export async function applyPayment(
    invoiceNumber: string,
    paymentAmount: string,
    paymentDate: string,
    paymentRef?: string,
): Promise<ActionResult> {
    await requireAdmin();

    const parsed = applyPaymentSchema.safeParse({
        invoiceNumber,
        paymentAmount,
        paymentDate,
        paymentRef,
    });

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return {
            success: false,
            error: firstError ?? 'Invalid payment data.',
        };
    }

    const result = await applyPaymentRecord(
        parsed.data.invoiceNumber,
        parseFloat(parsed.data.paymentAmount),
        parsed.data.paymentDate,
        parsed.data.paymentRef,
    );

    if (result.success) {
        revalidatePath(`/invoices/${invoiceNumber}`);
        revalidatePath('/invoices');
    }

    return result;
}
