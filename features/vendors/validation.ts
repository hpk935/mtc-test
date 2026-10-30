import { z } from 'zod/v4';
import { PO_STATUSES, VENDOR_TYPES } from './constants';

const trimmed = (max: number) => z.string().trim().max(max);
const required = (max: number, label: string) =>
    z.string().trim().min(1, `${label} is required`).max(max);
const optional = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .optional()
        .transform((v) => (v && v.length > 0 ? v : undefined));
const numericString = z
    .string()
    .regex(/^\d*\.?\d*$/, 'Must be a number')
    .default('0');

const PHONE_MESSAGE =
    'Phone number must contain 7–20 digits, no spaces or symbols';
const requiredPhoneSchema = z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\d{7,20}$/, PHONE_MESSAGE);
const optionalPhoneSchema = z
    .string()
    .optional()
    .default('')
    .refine((v) => v === '' || /^\d{7,20}$/.test(v), {
        message: PHONE_MESSAGE,
    });

const POSTAL_MESSAGE =
    'Postal code must contain 3–10 digits, no spaces or symbols';
const requiredPostalSchema = z
    .string()
    .min(1, 'Postal code is required')
    .regex(/^\d{3,10}$/, POSTAL_MESSAGE);

const optionalIsoDateSchema = z
    .string()
    .optional()
    .default('')
    .refine(
        (v) =>
            v === '' ||
            (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
                !Number.isNaN(new Date(v).getTime())),
        { message: 'Date added must be a valid date' },
    )
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const createVendorSchema = z.object({
    vendorCode: trimmed(10).min(1, 'Vendor code is required'),
    name: trimmed(255).min(1, 'Name is required'),
    address1: required(255, 'Address 1'),
    address2: optional(255),
    city: required(100, 'City'),
    state: required(10, 'State'),
    zip: requiredPostalSchema,
    phone: requiredPhoneSchema,
    fax: optionalPhoneSchema,
    accountNumber: optional(50),
    contactName: required(100, 'Contact name'),
    taxId: optional(20),
    send1099: z
        .string()
        .optional()
        .transform((v) => v === 'on' || v === 'true'),
    vendorType: z.enum(VENDOR_TYPES, { message: 'Vendor type is required' }),
    paymentTerms: optional(10),
    glAccountCode: optional(10),
    dateAdded: optionalIsoDateSchema,
    isActive: z
        .string()
        .optional()
        .transform((v) => v !== 'false' && v !== 'off'),
});
export type CreateVendorInput = z.infer<typeof createVendorSchema>;

export const updateVendorSchema = createVendorSchema;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

// Purchase order item (line) — used inside create/update PO payloads.
export const purchaseOrderItemSchema = z.object({
    productId: z.coerce.number().int().positive('Product is required'),
    qtyOrdered: z.coerce.number().int().positive('Qty must be > 0'),
    unitCost: z
        .string()
        .min(1, 'Unit cost is required')
        .regex(/^\d*\.?\d+$/, 'Unit cost must be a number')
        .refine((v) => Number(v) > 0, { message: 'Unit cost must be > 0' }),
});
export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;

export const createPurchaseOrderSchema = z.object({
    vendorId: z.coerce.number().int().positive('Vendor is required'),
    orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid order date'),
    expectedDate: z
        .string()
        .optional()
        .transform((v) => (v && v.length > 0 ? v : undefined)),
    freightAmount: numericString,
    notes: optional(2000),
    items: z
        .array(purchaseOrderItemSchema)
        .min(1, 'At least one line is required'),
});
export type CreatePurchaseOrderInput = z.infer<
    typeof createPurchaseOrderSchema
>;

// Same shape as create; server enforces that only drafts are mutable.
export const updatePurchaseOrderDraftSchema = createPurchaseOrderSchema;
export type UpdatePurchaseOrderDraftInput = z.infer<
    typeof updatePurchaseOrderDraftSchema
>;

export const receiveLineSchema = z.object({
    lineId: z.coerce.number().int().positive(),
    qtyToReceive: z.coerce.number().int().min(0),
});
export type ReceiveLineInput = z.infer<typeof receiveLineSchema>;

export const receivePurchaseOrderSchema = z.object({
    purchaseOrderId: z.coerce.number().int().positive(),
    receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
    lines: z
        .array(receiveLineSchema)
        .min(1)
        .refine(
            (lines) =>
                new Set(lines.map((l) => l.lineId)).size === lines.length,
            { message: 'Each line can only appear once per receipt.' },
        ),
});
export type ReceivePurchaseOrderInput = z.infer<
    typeof receivePurchaseOrderSchema
>;

export const poStatusSchema = z.enum(PO_STATUSES);
