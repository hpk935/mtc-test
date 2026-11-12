import { eq, or } from 'drizzle-orm';
import db from '@/lib/db';
import { terms, territories } from './schema';
import { referenceCodeStores } from './store';
import type { ReferenceCodeKind } from './constants';
import type { ReferenceCodeOption } from './types';

function byCode(a: string, b: string) {
    return a.localeCompare(b, undefined, { numeric: true });
}

function toOption(code: string, name: string): ReferenceCodeOption {
    return { code, label: name === code ? code : `${code} — ${name}` };
}

export async function findTerm(code: string) {
    const [term] = await db
        .select()
        .from(terms)
        .where(eq(terms.code, code))
        .limit(1);
    return term ?? null;
}

export async function findTerritory(code: string) {
    const [territory] = await db
        .select()
        .from(territories)
        .where(eq(territories.code, code))
        .limit(1);
    return territory ?? null;
}

/** Active terms, plus the code a record already holds even if it is retired. */
export async function getTermOptions(
    currentCode?: string,
): Promise<ReferenceCodeOption[]> {
    const rows = await db
        .select({ code: terms.code, description: terms.description })
        .from(terms)
        .where(
            currentCode
                ? or(eq(terms.isActive, true), eq(terms.code, currentCode))
                : eq(terms.isActive, true),
        );
    return rows
        .sort((a, b) => byCode(a.code, b.code))
        .map((t) => toOption(t.code, t.description));
}

/** Active territories, plus the code a record already holds even if retired. */
export async function getTerritoryOptions(
    currentCode?: string,
): Promise<ReferenceCodeOption[]> {
    const rows = await db
        .select({ code: territories.code, name: territories.name })
        .from(territories)
        .where(
            currentCode
                ? or(
                      eq(territories.isActive, true),
                      eq(territories.code, currentCode),
                  )
                : eq(territories.isActive, true),
        );
    return rows
        .sort((a, b) => byCode(a.code, b.code))
        .map((t) => toOption(t.code, t.name));
}

/** Every territory, retired ones included, for filtering historical reports. */
export async function getAllTerritoryCodes(): Promise<string[]> {
    const rows = await db.select({ code: territories.code }).from(territories);
    return rows.map((t) => t.code).sort(byCode);
}

export async function findReferenceCode(kind: ReferenceCodeKind, code: string) {
    return referenceCodeStores[kind].find(code);
}

export async function listReferenceCodes(
    kind: ReferenceCodeKind,
    isActive?: boolean,
) {
    const rows = await referenceCodeStores[kind].all();
    return rows
        .filter((row) => isActive === undefined || row.isActive === isActive)
        .sort((a, b) => byCode(a.code, b.code));
}

/** Active freight terms, plus the code a record already holds even if retired. */
export async function getFreightTermOptions(
    currentCode?: string,
): Promise<ReferenceCodeOption[]> {
    const rows = await listReferenceCodes('freightTerm');
    return rows
        .filter((t) => t.isActive || t.code === currentCode)
        .map((t) => toOption(t.code, t.description));
}

export async function isReferenceCodeInUse(
    kind: ReferenceCodeKind,
    code: string,
) {
    return referenceCodeStores[kind].isInUse(code);
}
