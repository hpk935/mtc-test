import { z } from 'zod';

const nonEmpty = (v: unknown) =>
    typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;

const pageSchema = z
    .string()
    .optional()
    .transform((v) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
    });

export const STOCK_STATUS_OPTIONS = [
    'all',
    'in_stock',
    'low_stock',
    'out_of_stock',
    'discontinued',
    'incoming',
] as const;
export type StockStatus = (typeof STOCK_STATUS_OPTIONS)[number];

/**
 * Inventory Status — filters.
 */
export const inventoryStatusFiltersSchema = z.object({
    search: z.preprocess(nonEmpty, z.string().optional()),
    unitSoldBy: z.preprocess(nonEmpty, z.string().optional()),
    stockStatus: z.preprocess(
        nonEmpty,
        z
            .enum([...STOCK_STATUS_OPTIONS] as [string, ...string[]])
            .optional()
            .default('in_stock'),
    ),
    page: pageSchema,
});
export type InventoryStatusFilters = z.infer<
    typeof inventoryStatusFiltersSchema
>;

/**
 * Item Invoice History — filters.
 */
export const itemInvoiceHistoryFiltersSchema = z.object({
    itemNumber: z.preprocess(nonEmpty, z.string().optional()),
    startDate: z.preprocess(nonEmpty, z.string().optional()),
    endDate: z.preprocess(nonEmpty, z.string().optional()),
    customerNumber: z.preprocess(nonEmpty, z.string().optional()),
    page: pageSchema,
});
export type ItemInvoiceHistoryFilters = z.infer<
    typeof itemInvoiceHistoryFiltersSchema
>;
