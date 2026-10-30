import { findTerm, findTerritory } from './queries';
import type { ReferenceCodes } from './types';

/**
 * Returns an error message unless each code is active. A code the record
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

    return null;
}
