import { z } from 'zod/v4';

const lineItemSchema = z.object({
    itemNumber: z.string().min(1, 'Item number is required'),
    qtyOrdered: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
    unitPrice: z.coerce.number().min(0, 'Price must be 0 or greater'),
    discount: z.coerce.number().min(0).default(0),
});

export const createOrderSchema = z.object({
    customerNumber: z.string().min(1, 'Customer is required'),
    salespersonCode: z.string().min(1, 'Salesperson is required'),
    orderDate: z.string().min(1, 'Order date is required'),
    customerPoReference: z.string().max(50).optional().default(''),
    freightTerm: z.string().min(1, 'Freight term is required'),
    shipToId: z.string().min(1, 'Ship-to address is required'),
    termCode: z.string().min(1, 'Term code is required'),
    territoryCode: z.string().min(1, 'Territory is required'),
    freightAmount: z.coerce.number().min(0).default(0),
    salesTaxAmount: z.coerce.number().min(0).default(0),
    shippingNote: z.string().optional().default(''),
    lineItems: z
        .array(lineItemSchema)
        .min(1, 'At least one line item is required'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type LineItemInput = z.infer<typeof lineItemSchema>;

export const updateOrderSchema = createOrderSchema;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export const updateTrackingNumberSchema = z.object({
    trackingNumber: z.string().max(100).optional().default(''),
});
