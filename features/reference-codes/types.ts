export interface ReferenceCodeOption {
    code: string;
    label: string;
}

export interface ReferenceCodes {
    termCode: string;
    territoryCode: string;
    /** Blank when the record has no freight term. */
    freightTerm: string;
}

/** One reference code, whichever table it lives in. */
export interface ReferenceCodeRecord {
    code: string;
    description: string;
    /** Always null for kinds without net days. */
    netDays: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ReferenceCodeValues {
    description: string;
    netDays: number | null;
    isActive: boolean;
}
