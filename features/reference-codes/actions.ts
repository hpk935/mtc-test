'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { REFERENCE_CODE_KIND, referenceCodeEditPath } from './constants';
import type { ReferenceCodeKind } from './constants';
import {
    createReferenceCodeRecord,
    deleteReferenceCodeRecord,
    toggleReferenceCodeActiveRecord,
    updateReferenceCodeRecord,
} from './service';
import { referenceCodeSchema } from './validation';
import type { ActionResult } from '@/types';

const INVALID_INPUT = 'Please check all fields and try again.';

export async function createReferenceCode(
    kind: ReferenceCodeKind,
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const parsed = referenceCodeSchema(kind).safeParse(
        Object.fromEntries(formData),
    );
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues[0]?.message ?? INVALID_INPUT,
        };
    }

    const result = await createReferenceCodeRecord(kind, parsed.data);
    if (!result.success) return result;

    const { path } = REFERENCE_CODE_KIND[kind];
    revalidatePath(path);
    redirect(path);
}

export async function updateReferenceCode(
    kind: ReferenceCodeKind,
    code: string,
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const parsed = referenceCodeSchema(kind).safeParse({
        ...Object.fromEntries(formData),
        code,
    });
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues[0]?.message ?? INVALID_INPUT,
        };
    }

    const result = await updateReferenceCodeRecord(kind, code, parsed.data);
    if (result.success) revalidate(kind, code);
    return result;
}

export async function toggleReferenceCodeActive(
    kind: ReferenceCodeKind,
    code: string,
): Promise<ActionResult> {
    await requireAdmin();

    const result = await toggleReferenceCodeActiveRecord(kind, code);
    if (result.success) revalidate(kind, code);
    return result;
}

export async function deleteReferenceCode(
    kind: ReferenceCodeKind,
    code: string,
): Promise<ActionResult> {
    await requireAdmin();

    const result = await deleteReferenceCodeRecord(kind, code);
    if (!result.success) return result;

    const { path } = REFERENCE_CODE_KIND[kind];
    revalidatePath(path);
    redirect(path);
}

function revalidate(kind: ReferenceCodeKind, code: string) {
    const { path } = REFERENCE_CODE_KIND[kind];
    revalidatePath(path);
    revalidatePath(referenceCodeEditPath(kind, code));
}
