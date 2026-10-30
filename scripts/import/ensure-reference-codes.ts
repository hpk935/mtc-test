// scripts/import/ensure-reference-codes.ts — Register legacy codes before insert
//
// Imported rows must keep their legacy codes, and the foreign keys need each code
// to exist. Codes not yet defined are added like the migration's backfill: terms
// inactive until confirmed in reference-codes.ts, territories named by their code.

import type { ReferenceCodes } from '../../features/reference-codes/types';

export async function ensureReferenceCodes(
    rows: ReferenceCodes[],
    { dryRun = false }: { dryRun?: boolean } = {},
) {
    const { default: db } = await import('../../lib/db');
    const { terms, territories } = await import(
        '../../features/reference-codes/schema'
    );

    const existingTerms = await db.select({ code: terms.code }).from(terms);
    const existingTerritories = await db
        .select({ code: territories.code })
        .from(territories);

    const knownTerms = new Set(existingTerms.map((t) => t.code));
    const knownTerritories = new Set(existingTerritories.map((t) => t.code));

    const newTerms = [...new Set(rows.map((r) => r.termCode))].filter(
        (code) => !knownTerms.has(code),
    );
    const newTerritories = [...new Set(rows.map((r) => r.territoryCode))].filter(
        (code) => !knownTerritories.has(code),
    );

    if (newTerms.length > 0) {
        console.log(`  New inactive term codes: ${newTerms.join(', ')}`);
    }
    if (newTerritories.length > 0) {
        console.log(`  New territory codes: ${newTerritories.join(', ')}`);
    }
    if (dryRun) return;

    if (newTerms.length > 0) {
        await db
            .insert(terms)
            .values(
                newTerms.map((code) => ({
                    code,
                    description: code,
                    isActive: false,
                })),
            )
            .onConflictDoNothing();
    }
    if (newTerritories.length > 0) {
        await db
            .insert(territories)
            .values(newTerritories.map((code) => ({ code, name: code })))
            .onConflictDoNothing();
    }
}
