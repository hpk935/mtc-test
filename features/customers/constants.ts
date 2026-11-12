export const ACCOUNT_STATUSES = ['active', 'inactive', 'on_hold'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const LOCATION_STATUSES = ['active', 'inactive'] as const;
export type LocationStatus = (typeof LOCATION_STATUSES)[number];
