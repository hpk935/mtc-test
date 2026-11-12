import { z } from 'zod/v4';
import { UNITS_SOLD_BY } from './constants';

// Optional numeric: empty/missing -> '0'. Accepts only valid non-negative numbers.
const numericString = z
    .string()
    .regex(/^\d*\.?\d*$/, 'Must be a number')
    .default('0');

// Required numeric: must be present and a valid non-negative number (0 allowed).
function requiredNumericString(label: string) {
    return z
        .string({ message: `${label} is required` })
        .min(1, `${label} is required`)
        .regex(/^\d+(\.\d+)?$/, `${label} must be a valid number`);
}

// Required non-negative integer (0 allowed). Rejects blanks.
function requiredNonNegativeInt(label: string) {
    return z
        .string({ message: `${label} is required` })
        .min(1, `${label} is required`)
        .regex(/^\d+$/, `${label} must be a whole number`)
        .transform((v) => parseInt(v, 10))
        .pipe(z.number().int().min(0));
}

const optionalString = z.string().max(500).optional().default('');

export const createProductSchema = z.object({
    itemNumber: z.string().min(1, 'Item number is required').max(50),
    description: z.string().min(1, 'Description is required').max(500),
    unitSoldBy: z.enum(UNITS_SOLD_BY, {
        message: 'Unit sold by is required',
    }),
    minQty: requiredNonNegativeInt('Inner case pack'),
    maxQty: requiredNonNegativeInt('Master case pack'),
    productType: z.string().max(10).optional().default(''),
    dimensionsL: requiredNumericString('Length'),
    dimensionsW: requiredNumericString('Width'),
    dimensionsH: requiredNumericString('Height'),
    cubicFeet: numericString,
    caseWeight: requiredNumericString('Case weight'),
    upcNumber: optionalString,
    landedCost: requiredNumericString('Landed cost'),
    minimumPackPrice: requiredNumericString('Inner case price'),
    casePrice: requiredNumericString('Case price'),
    qtyInStock: requiredNonNegativeInt('Qty in stock'),
    qtyOnOrder: z.coerce.number().int().min(0).default(0),
    nob: z.coerce.number().int().min(0).optional(),
    isDiscontinued: z
        .string()
        .optional()
        .transform((v) => v === 'on' || v === 'true'),
    htsCode: optionalString,
    leadTime: optionalString,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// After creation, stock and qty on order are maintained by purchase order
// receipts and invoices, never by the product form.
export const updateProductSchema = createProductSchema.omit({
    qtyInStock: true,
    qtyOnOrder: true,
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
