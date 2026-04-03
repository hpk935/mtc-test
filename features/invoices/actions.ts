'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { updateInvoiceStatusSchema } from './validation';
import { updateInvoiceStatusRecord } from './service';
import type { ActionResult } from '@/types';

export async function updateInvoiceStatus(
    invoiceNumber: string,
    newStatus: string,
): Promise<ActionResult> {
    await requireAuth();

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
