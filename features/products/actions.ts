'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createProductSchema, updateProductSchema } from './validation';
import {
    createProductRecord,
    generateProductId,
    updateProductRecord,
} from './service';
import type { ActionResult } from '@/types';

export async function createProduct(
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const raw = Object.fromEntries(formData);
    const parsed = createProductSchema.safeParse(raw);

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return {
            success: false,
            error: firstError ?? 'Please check all fields and try again.',
        };
    }

    const productId = await generateProductId();

    const result = await createProductRecord({
        ...parsed.data,
        productId,
    });

    if (!result.success) {
        return result;
    }

    redirect('/products');
}

export async function updateProduct(
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const productId = Number(formData.get('productId'));
    if (!productId) {
        return { success: false, error: 'Product ID is required.' };
    }

    const raw = Object.fromEntries(formData);
    const parsed = updateProductSchema.safeParse(raw);

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return {
            success: false,
            error: firstError ?? 'Please check all fields and try again.',
        };
    }

    const result = await updateProductRecord(productId, parsed.data);
    if (!result.success) {
        return result;
    }

    revalidatePath(`/products/${productId}`);
    revalidatePath('/products');

    return { success: true, data: undefined };
}
