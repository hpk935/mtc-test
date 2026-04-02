export const PRODUCT_TYPES = ['CS', 'EA', 'BX', 'PK', 'ST', 'DZ'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const UNITS_SOLD_BY = ['CS', 'EA', 'BX', 'PK', 'ST', 'DZ'] as const;
export type UnitSoldBy = (typeof UNITS_SOLD_BY)[number];
