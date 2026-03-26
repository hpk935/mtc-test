'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { createCustomerSchema, updateCustomerSchema } from './validation';
import { createCustomerRecord, updateCustomerRecord } from './service';
import type { ActionResult } from '@/types';

export async function createCustomer(
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAuth();

    const raw = Object.fromEntries(formData);
    const parsed = createCustomerSchema.safeParse(raw);

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return {
            success: false,
            error: firstError ?? 'Please check all fields and try again.',
        };
    }

    const result = await createCustomerRecord(parsed.data);
    if (!result.success) {
        return result;
    }

    redirect('/customers');
}

export async function updateCustomer(
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAuth();

    const customerNumber = formData.get('customerNumber') as string;
    if (!customerNumber) {
        return { success: false, error: 'Customer number is required.' };
    }

    const raw = Object.fromEntries(formData);
    const parsed = updateCustomerSchema.safeParse(raw);

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return {
            success: false,
            error: firstError ?? 'Please check all fields and try again.',
        };
    }

    const result = await updateCustomerRecord(customerNumber, parsed.data);
    if (!result.success) {
        return result;
    }

    revalidatePath(`/customers/${customerNumber}`);
    revalidatePath('/customers');

    return { success: true, data: undefined };
}
