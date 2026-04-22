import { z } from 'zod';
import { ACCOUNT_STATUSES } from '@/features/customers/constants';
import { INVOICE_STATUSES } from '@/features/invoices/constants';

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
 * Customer Name Listing — filters.
 */
export const customerListingFiltersSchema = z.object({
    search: z.preprocess(nonEmpty, z.string().optional()),
    salesperson: z.preprocess(nonEmpty, z.string().optional()),
    territory: z.preprocess(nonEmpty, z.string().optional()),
    status: z
        .enum([...ACCOUNT_STATUSES, 'all'])
        .optional()
        .default('active'),
    page: pageSchema,
});
export type CustomerListingFilters = z.infer<
    typeof customerListingFiltersSchema
>;

/**
 * Customer Invoice Summary — filters. Supports per-customer and all-customers views.
 */
export const customerInvoicesFiltersSchema = z.object({
    view: z.enum(['per-customer', 'all']).optional().default('all'),
    customerNumber: z.preprocess(nonEmpty, z.string().optional()),
    salesperson: z.preprocess(nonEmpty, z.string().optional()),
    territory: z.preprocess(nonEmpty, z.string().optional()),
    status: z
        .enum([...INVOICE_STATUSES, 'all'])
        .optional()
        .default('all'),
    startDate: z.preprocess(nonEmpty, z.string().optional()),
    endDate: z.preprocess(nonEmpty, z.string().optional()),
    page: pageSchema,
    invPage: pageSchema,
});
export type CustomerInvoicesFilters = z.infer<
    typeof customerInvoicesFiltersSchema
>;

/**
 * Customer Purchase History — filters. Supports per-customer and cross-customer views.
 */
export const customerPurchasesFiltersSchema = z.object({
    view: z.enum(['per-customer', 'all']).optional().default('all'),
    customerNumber: z.preprocess(nonEmpty, z.string().optional()),
    startDate: z.preprocess(nonEmpty, z.string().optional()),
    endDate: z.preprocess(nonEmpty, z.string().optional()),
    salesperson: z.preprocess(nonEmpty, z.string().optional()),
    territory: z.preprocess(nonEmpty, z.string().optional()),
    page: pageSchema,
    itemPage: pageSchema,
});
export type CustomerPurchasesFilters = z.infer<
    typeof customerPurchasesFiltersSchema
>;

/**
 * Sales & Aging Summary — filters.
 */
export const agingSummaryFiltersSchema = z.object({
    asOf: z.preprocess(nonEmpty, z.string().optional()),
    customerNumber: z.preprocess(nonEmpty, z.string().optional()),
    salesperson: z.preprocess(nonEmpty, z.string().optional()),
    territory: z.preprocess(nonEmpty, z.string().optional()),
    page: pageSchema,
});
export type AgingSummaryFilters = z.infer<typeof agingSummaryFiltersSchema>;
