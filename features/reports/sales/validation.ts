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

/**
 * Aging by Salesperson — filters.
 */
export const agingBySalespersonFiltersSchema = z.object({
    territory: z.preprocess(nonEmpty, z.string().optional()),
    salesperson: z.preprocess(nonEmpty, z.string().optional()),
    page: pageSchema,
});
export type AgingBySalespersonFilters = z.infer<
    typeof agingBySalespersonFiltersSchema
>;
