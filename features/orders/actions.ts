'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import {
    createOrderSchema,
    updateOrderSchema,
    updateTrackingNumberSchema,
} from './validation';
import {
    createOrderRecord,
    updateOrderRecord,
    deleteOrderRecord,
    voidOrderRecord,
    postOrderToInvoice,
} from './service';
import type { ActionResult } from '@/types';
import db from '@/lib/db';
import { orders } from './schema';
import { eq } from 'drizzle-orm';

export async function createOrder(
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const rawJson = formData.get('orderData');
    if (typeof rawJson !== 'string') {
        return { success: false, error: 'Invalid form submission.' };
    }

    let raw: unknown;
    try {
        raw = JSON.parse(rawJson);
    } catch {
        return { success: false, error: 'Invalid form data.' };
    }

    const parsed = createOrderSchema.safeParse(raw);

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return {
            success: false,
            error: firstError ?? 'Please check all fields and try again.',
        };
    }

    const result = await createOrderRecord(parsed.data);

    if (!result.success) {
        return result;
    }

    redirect(`/orders/${result.data}`);
}

export async function updateOrder(
    orderNumber: string,
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const rawJson = formData.get('orderData');
    if (typeof rawJson !== 'string') {
        return { success: false, error: 'Invalid form submission.' };
    }

    let raw: unknown;
    try {
        raw = JSON.parse(rawJson);
    } catch {
        return { success: false, error: 'Invalid form data.' };
    }

    const parsed = updateOrderSchema.safeParse(raw);

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return {
            success: false,
            error: firstError ?? 'Please check all fields and try again.',
        };
    }

    const result = await updateOrderRecord(orderNumber, parsed.data);

    if (!result.success) {
        return result;
    }

    redirect(`/orders/${result.data}`);
}

export async function deleteOrder(orderNumber: string): Promise<ActionResult> {
    await requireAdmin();

    const result = await deleteOrderRecord(orderNumber);

    if (!result.success) {
        return result;
    }

    redirect('/orders');
}

export async function voidOrder(orderNumber: string): Promise<ActionResult> {
    await requireAdmin();

    const result = await voidOrderRecord(orderNumber);

    if (!result.success) {
        return result;
    }

    revalidatePath(`/orders/${orderNumber}`);
    revalidatePath('/orders');
    return { success: true, data: undefined };
}

export async function postToInvoice(
    orderNumber: string,
): Promise<ActionResult<string>> {
    await requireAdmin();

    const result = await postOrderToInvoice(orderNumber);

    if (!result.success) {
        return result;
    }

    revalidatePath('/orders');
    revalidatePath('/invoices');
    redirect(`/invoices/${result.data}`);
}

export async function updateTrackingNumber(
    orderNumber: string,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const parsed = updateTrackingNumberSchema.safeParse({
        trackingNumber: formData.get('trackingNumber'),
    });

    if (!parsed.success) {
        return { success: false, error: 'Invalid tracking number.' };
    }

    const value = parsed.data.trackingNumber || null;

    await db
        .update(orders)
        .set({ trackingNumber: value, updatedAt: new Date() })
        .where(eq(orders.orderNumber, orderNumber));

    revalidatePath(`/orders/${orderNumber}`);
    return { success: true, data: undefined };
}
