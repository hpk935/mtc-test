export const UNITS_SOLD_BY = ['CS', 'EA', 'BX', 'PK', 'ST', 'DZ'] as const;
export type UnitSoldBy = (typeof UNITS_SOLD_BY)[number];
