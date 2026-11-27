import { findTerm, findTerritory } from './queries';
import { referenceCodeStores } from './store';
import { REFERENCE_CODE_KIND } from './constants';
import type { ReferenceCodeKind } from './constants';
import type { ReferenceCodes, ReferenceCodeValues } from './types';
import type { ReferenceCodeInput } from './validation';
import type { ActionResult } from '@/types';

/**
 * Returns an error message unless each code is active (a blank freight term
 * is allowed). A code the record
 * already holds is always accepted, so imported records with retired codes can
 * still be edited; changing it requires an active code.
 */
export async function validateReferenceCodes(
    codes: ReferenceCodes,
    stored?: ReferenceCodes,
): Promise<string | null> {
    if (codes.termCode !== stored?.termCode) {
        const term = await findTerm(codes.termCode);
        if (!term?.isActive) {
            return `Payment term "${codes.termCode}" is not available.`;
        }
    }

    if (codes.territoryCode !== stored?.territoryCode) {
        const territory = await findTerritory(codes.territoryCode);
        if (!territory?.isActive) {
            return `Territory "${codes.territoryCode}" is not available.`;
        }
    }

    if (codes.freightTerm !== stored?.freightTerm && codes.freightTerm.trim()) {
        const freightTerm = await referenceCodeStores.freightTerm.find(
            codes.freightTerm,
        );
        if (!freightTerm?.isActive) {
            return `Freight term "${codes.freightTerm}" is not available.`;
        }
    }

    return null;
}

function valuesFor(
    kind: ReferenceCodeKind,
    input: ReferenceCodeInput,
): ReferenceCodeValues {
    return {
        description: input.description || input.code,
        netDays: REFERENCE_CODE_KIND[kind].hasNetDays ? input.netDays : null,
        isActive: input.isActive,
    };
}

function notFound(kind: ReferenceCodeKind, code: string): ActionResult {
    return {
        success: false,
        error: `${REFERENCE_CODE_KIND[kind].singular} "${code}" not found.`,
    };
}

/** Only codes that can produce a due date may be offered to staff. */
function checkValues(
    kind: ReferenceCodeKind,
    values: ReferenceCodeValues,
): string | null {
    if (
        REFERENCE_CODE_KIND[kind].hasNetDays &&
        values.isActive &&
        values.netDays === null
    ) {
        return 'Net days are required for an active payment term.';
    }
    return null;
}

export async function createReferenceCodeRecord(
    kind: ReferenceCodeKind,
    input: ReferenceCodeInput,
): Promise<ActionResult> {
    const store = referenceCodeStores[kind];
    const existing = await store.findSpelling(input.code);
    if (existing) {
        return {
            success: false,
            error: `${REFERENCE_CODE_KIND[kind].singular} "${existing}" already exists.`,
        };
    }

    const values = valuesFor(kind, input);
    const error = checkValues(kind, values);
    if (error) return { success: false, error };

    await store.insert(input.code, values);
    return { success: true, data: undefined };
}

/** The code itself never changes: records refer to it by value. */
export async function updateReferenceCodeRecord(
    kind: ReferenceCodeKind,
    code: string,
    input: ReferenceCodeInput,
): Promise<ActionResult> {
    const store = referenceCodeStores[kind];
    if (!(await store.find(code))) return notFound(kind, code);

    const values = valuesFor(kind, { ...input, code });
    const error = checkValues(kind, values);
    if (error) return { success: false, error };

    await store.update(code, values);
    return { success: true, data: undefined };
}

export async function toggleReferenceCodeActiveRecord(
    kind: ReferenceCodeKind,
    code: string,
): Promise<ActionResult> {
    const store = referenceCodeStores[kind];
    const record = await store.find(code);
    if (!record) return notFound(kind, code);

    const values = {
        description: record.description,
        netDays: record.netDays,
        isActive: !record.isActive,
    };
    const error = checkValues(kind, values);
    if (error) return { success: false, error };

    await store.update(code, values);
    return { success: true, data: undefined };
}

/** Only unused codes can be deleted; anything else should be deactivated. */
export async function deleteReferenceCodeRecord(
    kind: ReferenceCodeKind,
    code: string,
): Promise<ActionResult> {
    const store = referenceCodeStores[kind];
    const { singular } = REFERENCE_CODE_KIND[kind];
    if (!(await store.find(code))) return notFound(kind, code);
    if (await store.isInUse(code)) {
        return {
            success: false,
            error: `${singular} "${code}" is in use by customers, orders or invoices. Deactivate it instead.`,
        };
    }

    await store.remove(code);
    return { success: true, data: undefined };
}
