export const PERIOD_OPTIONS = ['1m', '3m', '6m', '12m'] as const;
export type PeriodOption = (typeof PERIOD_OPTIONS)[number];
