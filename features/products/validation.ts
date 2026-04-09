import { z } from 'zod/v4';

const numericString = z
    .string()
    .regex(/^\d*\.?\d*$/, 'Must be a number')
    .default('0');

const optionalString = z.string().max(500).optional().default('');

export const createProductSchema = z.object({
    itemNumber: z.string().min(1, 'Item number is required').max(50),
    description: z.string().min(1, 'Description is required').max(500),
    cartonNumber: optionalString,
    unitSoldBy: z.string().min(1, 'Unit sold by is required').max(10),
    minQty: z.coerce.number().int().min(0).default(0),
    maxQty: z.coerce.number().int().min(0).default(0),
    productType: z.string().min(1, 'Product type is required').max(10),
    dimensionsL: numericString,
    dimensionsW: numericString,
    dimensionsH: numericString,
    cubicFeet: numericString,
    caseWeight: numericString,
    upcNumber: optionalString,
    landedCost: numericString,
    minimumPackPrice: numericString,
    casePrice: numericString,
    itemCostHk: numericString,
    qtyInStock: z.coerce.number().int().min(0).default(0),
    qtyOnOrder: z.coerce.number().int().min(0).default(0),
    upcomingShipmentNo: optionalString,
    upcomingShipmentArrival: z.string().optional().default(''),
    upcomingShipmentQty: z.coerce.number().int().min(0).optional(),
    nob: z.coerce.number().int().min(0).optional(),
    isDiscontinued: z
        .string()
        .optional()
        .transform((v) => v === 'on' || v === 'true'),
    htsCode: optionalString,
    leadTime: optionalString,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema;

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
