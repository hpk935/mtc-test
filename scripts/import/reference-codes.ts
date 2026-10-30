// scripts/import/reference-codes.ts — Term and territory definitions
// Edit this file, then apply it with: npx tsx scripts/import/seed-reference-codes.ts
//
// To make a term selectable on customers and orders, set its description and
// netDays and change isActive to true. Use netDays: 0 for terms due on receipt.
// Inactive terms stay valid on the records that already use them.

interface TermDefinition {
    code: string;
    description: string;
    netDays: number | null;
    isActive: boolean;
}

interface TerritoryName {
    code: string;
    name: string;
}

export const TERMS: TermDefinition[] = [
    { code: '10', description: 'Net 10', netDays: 10, isActive: true },
    { code: '15', description: 'Net 15', netDays: 15, isActive: true },
    { code: '21', description: 'Net 21', netDays: 21, isActive: true },
    { code: '30', description: 'Net 30', netDays: 30, isActive: true },
    { code: '45', description: 'Net 45', netDays: 45, isActive: true },
    { code: '60', description: 'Net 60', netDays: 60, isActive: true },
    { code: '90', description: 'Net 90', netDays: 90, isActive: true },

    // Unconfirmed legacy codes. The trailing comments are guesses.
    { code: 'CH', description: 'CH', netDays: null, isActive: false }, // check?
    { code: 'CHK', description: 'CHK', netDays: null, isActive: false }, // check?
    { code: 'CA', description: 'CA', netDays: null, isActive: false }, // cash?
    { code: 'ca', description: 'ca', netDays: null, isActive: false }, // cash?
    { code: 'CC', description: 'CC', netDays: null, isActive: false }, // credit card?
    { code: 'COD', description: 'COD', netDays: null, isActive: false }, // cash on delivery?
    { code: 'PP', description: 'PP', netDays: null, isActive: false }, // prepaid?
    { code: 'WIRE', description: 'WIRE', netDays: null, isActive: false }, // wire transfer?
    { code: 'N30', description: 'N30', netDays: null, isActive: false }, // net 30?
    { code: '1%15', description: '1%15', netDays: null, isActive: false }, // 1% discount, net 15?
    { code: '1%30', description: '1%30', netDays: null, isActive: false }, // 1% discount, net 30?
    { code: 'COMM', description: 'COMM', netDays: null, isActive: false }, // unknown
    { code: 'NS', description: 'NS', netDays: null, isActive: false }, // unknown
    { code: 'RG', description: 'RG', netDays: null, isActive: false }, // unknown
    { code: 'CDMO', description: 'CDMO', netDays: null, isActive: false }, // unknown
    { code: 'UPS', description: 'UPS', netDays: null, isActive: false }, // unknown
    { code: '??', description: '??', netDays: null, isActive: false }, // unknown
];

// Legacy exports only hold territory codes, so a territory's name is its code
// until it is listed here, e.g. { code: '44', name: 'Northern California' }.
export const TERRITORY_NAMES: TerritoryName[] = [];
