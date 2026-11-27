export const REFERENCE_CODE_KINDS = [
    'term',
    'territory',
    'freightTerm',
] as const;
export type ReferenceCodeKind = (typeof REFERENCE_CODE_KINDS)[number];

export interface ReferenceCodeKindConfig {
    singular: string;
    plural: string;
    /** List page; new and edit pages live underneath it. */
    path: string;
    /** Matches the code column length in the schema. */
    codeMaxLength: number;
    codePlaceholder: string;
    /** Payment terms carry the days until an invoice is due. */
    hasNetDays: boolean;
    summary: string;
}

export const REFERENCE_CODE_KIND: Record<
    ReferenceCodeKind,
    ReferenceCodeKindConfig
> = {
    term: {
        singular: 'Payment Term',
        plural: 'Payment Terms',
        path: '/payment-terms',
        codeMaxLength: 10,
        codePlaceholder: 'e.g. N30',
        hasNetDays: true,
        summary: 'Payment terms set when an invoice falls due.',
    },
    territory: {
        singular: 'Territory',
        plural: 'Territories',
        path: '/territories',
        codeMaxLength: 20,
        codePlaceholder: 'e.g. WEST',
        hasNetDays: false,
        summary: 'Sales territories assigned to customers and orders.',
    },
    freightTerm: {
        singular: 'Freight Term',
        plural: 'Freight Terms',
        path: '/freight-terms',
        codeMaxLength: 50,
        codePlaceholder: 'e.g. 10% FREIGHT',
        hasNetDays: false,
        summary: 'Freight terms offered on customers and orders.',
    },
};

export function referenceCodeEditPath(kind: ReferenceCodeKind, code: string) {
    return `${REFERENCE_CODE_KIND[kind].path}/${encodeURIComponent(code)}/edit`;
}

/** Route params may arrive still encoded; codes such as "10% FREIGHT" contain %. */
export function decodeCodeParam(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}
