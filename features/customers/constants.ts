export const ACCOUNT_STATUSES = ['active', 'inactive', 'on_hold'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const LOCATION_STATUSES = ['active', 'inactive'] as const;
export type LocationStatus = (typeof LOCATION_STATUSES)[number];

export const FREIGHT_TERMS = [
    '03% FREIGHT',
    '05% FREIGHT',
    '06% FREIGHT',
    '07% FREIGHT',
    '08% FREIGHT',
    '10% FREIGHT',
    '15% FREIGHT',
    'DELIVER',
    'FREE FREIGHT',
    'FREIGHT COLLECT',
    'FRT PREPAID',
    'FULL FREIGHT',
    'PICK UP',
    'SEE COMMENTS',
] as const;
export type FreightTerm = (typeof FREIGHT_TERMS)[number];
