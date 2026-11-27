import { z } from 'zod/v4';

const lineItemSchema = z.object({
    itemNumber: z.string().min(1, 'Item number is required'),
    qtyOrdered: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
    unitPrice: z.coerce.number().min(0, 'Price must be 0 or greater'),
    discount: z.coerce.number().min(0).default(0),
});

// ISO date (YYYY-MM-DD) — what <input type="date"> emits.
const isoDateSchema = z
    .string()
    .min(1, 'Order date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Order date must be a valid date')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), {
        message: 'Order date must be a valid date',
    });

export const createOrderSchema = z.object({
    customerNumber: z.string().min(1, 'Customer is required').max(20),
    salespersonCode: z.string().min(1, 'Salesperson is required').max(10),
    orderDate: isoDateSchema,
    customerPoReference: z.string().max(50).optional().default(''),
    // Optional. Stored as '' until DB columns are made nullable.
    freightTerm: z.string().max(50).optional().default(''),
    shipToId: z.string().min(1, 'Ship-to address is required').max(20),
    termCode: z.string().min(1, 'Payment term is required').max(10),
    territoryCode: z.string().min(1, 'Territory is required').max(20),
    freightAmount: z.coerce
        .number({ message: 'Freight amount must be a number' })
        .min(0, 'Freight amount must be 0 or greater')
        .default(0),
    salesTaxAmount: z.coerce
        .number({ message: 'Sales tax must be a number' })
        .min(0, 'Sales tax must be 0 or greater')
        .default(0),
    shippingNote: z.string().max(2000).optional().default(''),
    // Customer credit applied as a discount on this order. Rounded to cents
    // here, once, so the stored credit, the order total and the amount
    // drawn at invoicing are all the same number.
    creditAmount: z.coerce
        .number({ message: 'Credit must be a number' })
        .min(0, 'Credit must be 0 or greater')
        .default(0)
        .transform((n) => Math.round(n * 100) / 100),
    lineItems: z
        .array(lineItemSchema)
        .min(1, 'At least one line item is required')
        .refine((items) => items.some((i) => i.qtyOrdered > 0), {
            message:
                'At least one line item must have a quantity greater than 0',
        }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type LineItemInput = z.infer<typeof lineItemSchema>;

export const updateOrderSchema = createOrderSchema;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export const updateTrackingNumberSchema = z.object({
    trackingNumber: z.string().max(100).optional().default(''),
});
