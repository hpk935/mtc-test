import { z } from 'zod/v4';
import {
    isValidPostalCode,
    normalizePostalCode,
    POSTAL_CODE_MESSAGE,
} from '@/lib/postal';
import { ACCOUNT_STATUSES, LOCATION_STATUSES } from './constants';

const isoDateSchema = z
    .string()
    .min(1, 'Account open date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Account open date must be a valid date')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), {
        message: 'Account open date must be a valid date',
    });

// Phone numbers: digits only, 7–20 digits. Strip nothing — frontend filters input.
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

// Digits-only string of any length up to 10 (used for phone extension).
const optionalExtensionSchema = z
    .string()
    .optional()
    .default('')
    .refine((v) => v === '' || /^\d{1,10}$/.test(v), {
        message: 'Extension must contain digits only',
    });

// Postal code: US ZIP (+4 optional) or international, see lib/postal.
const requiredPostalSchema = z
    .string()
    .transform(normalizePostalCode)
    .pipe(
        z
            .string()
            .min(1, 'Postal code is required')
            .refine(isValidPostalCode, POSTAL_CODE_MESSAGE),
    );

const optionalPostalSchema = z
    .string()
    .optional()
    .default('')
    .transform(normalizePostalCode)
    .refine((v) => v === '' || isValidPostalCode(v), {
        message: POSTAL_CODE_MESSAGE,
    });

export const createCustomerSchema = z.object({
    customerName: z.string().min(1, 'Customer name is required').max(255),
    primaryContactName: z
        .string()
        .min(1, 'Primary contact name is required')
        .max(255),
    billingAddress1: z.string().min(1, 'Billing address is required').max(255),
    billingAddress2: z.string().max(255).optional().default(''),
    billingCity: z.string().min(1, 'City is required').max(100),
    billingStateCode: z.string().min(1, 'State is required').max(10),
    billingPostalCode: requiredPostalSchema,
    countryCode: z.string().max(5).optional().default('US'),
    mainPhone: requiredPhoneSchema,
    phoneExtension: optionalExtensionSchema,
    faxNumber: optionalPhoneSchema,
    mainEmail: z.email('Invalid email address').max(255),
    taxId: z.string().max(20).optional().default(''),
    termCode: z.string().min(1, 'Payment term is required').max(10),
    territoryCode: z.string().min(1, 'Territory is required').max(20),
    salespersonCode: z.string().min(1, 'Salesperson is required').max(10),
    defaultFreightTerm: z.string().max(50).optional().default(''),
    accountStatus: z.enum(ACCOUNT_STATUSES).optional().default('active'),
    accountOpenDate: isoDateSchema,
    customerNote: z.string().max(2000).optional().default(''),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const createCustomerWithShipToSchema = createCustomerSchema
    .extend({
        sameAsBilling: z
            .string()
            .optional()
            .transform((v) => v === 'on' || v === 'true'),
        shipLocationName: z
            .string()
            .min(1, 'Location name is required')
            .max(255),
        shipAddress1: z.string().max(255).optional().default(''),
        shipAddress2: z.string().max(255).optional().default(''),
        shipCity: z.string().max(100).optional().default(''),
        shipStateCode: z.string().max(10).optional().default(''),
        shipPostalCode: optionalPostalSchema,
        shipCountryCode: z.string().max(5).optional().default('US'),
        shipContactName: z.string().max(255).optional().default(''),
        shipPhone: optionalPhoneSchema,
    })
    .superRefine((data, ctx) => {
        if (data.sameAsBilling) return;
        const required = [
            ['shipAddress1', 'Shipping street address is required'],
            ['shipCity', 'Shipping city is required'],
            ['shipStateCode', 'Shipping state is required'],
            ['shipPostalCode', 'Shipping postal code is required'],
        ] as const;
        for (const [field, message] of required) {
            if (!data[field] || data[field].trim() === '') {
                ctx.addIssue({
                    code: 'custom',
                    path: [field],
                    message,
                });
            }
        }
    });

export type CreateCustomerWithShipToInput = z.infer<
    typeof createCustomerWithShipToSchema
>;

export const updateCustomerSchema = createCustomerSchema;

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// Imported customers hold contact values in legacy formats, e.g. phones like
// "(555) 123-4567". An unchanged stored value is accepted as-is so the rest of
// the record can still be edited; a changed value must pass the normal rules.
const LEGACY_FORMAT_FIELDS = [
    'mainPhone',
    'faxNumber',
    'mainEmail',
    'billingPostalCode',
] as const;

type LegacyFormatField = (typeof LEGACY_FORMAT_FIELDS)[number];

export function updateCustomerSchemaFor(
    stored: Record<LegacyFormatField, string | null>,
) {
    const shape = Object.fromEntries(
        LEGACY_FORMAT_FIELDS.map((field) => [
            field,
            z.union([
                z.literal(stored[field] ?? ''),
                createCustomerSchema.shape[field],
            ]),
        ]),
    ) as {
        [F in LegacyFormatField]: z.ZodUnion<
            [z.ZodLiteral<string>, (typeof createCustomerSchema.shape)[F]]
        >;
    };
    return updateCustomerSchema.extend(shape);
}

export const createShipToSchema = z.object({
    customerNumber: z.string().min(1, 'Customer number is required').max(20),
    locationName: z.string().min(1, 'Location name is required').max(255),
    locationStatus: z.enum(LOCATION_STATUSES).optional().default('active'),
    address1: z.string().min(1, 'Address is required').max(255),
    address2: z.string().max(255).optional().default(''),
    city: z.string().min(1, 'City is required').max(100),
    stateCode: z.string().min(1, 'State is required').max(10),
    postalCode: requiredPostalSchema,
    countryCode: z.string().max(5).optional().default('US'),
    contactName: z.string().max(255).optional().default(''),
    mainPhone: optionalPhoneSchema,
    isFavorite: z
        .string()
        .optional()
        .transform((v) => v === 'on' || v === 'true'),
    customerNote: z.string().max(2000).optional().default(''),
});

export type CreateShipToInput = z.infer<typeof createShipToSchema>;

export const updateShipToSchema = createShipToSchema.omit({
    customerNumber: true,
});

export type UpdateShipToInput = z.infer<typeof updateShipToSchema>;

// Imported ship-to addresses can have blank or legacy-format address values.
// As with customers, an unchanged stored value is accepted as-is; a changed
// value must pass the normal rules.
const LEGACY_SHIP_TO_FIELDS = [
    'address1',
    'city',
    'stateCode',
    'postalCode',
    'mainPhone',
] as const;

export type LegacyShipToField = (typeof LEGACY_SHIP_TO_FIELDS)[number];

export function updateShipToSchemaFor(
    stored: Record<LegacyShipToField, string | null>,
) {
    const shape = Object.fromEntries(
        LEGACY_SHIP_TO_FIELDS.map((field) => [
            field,
            z.union([
                z.literal(stored[field] ?? ''),
                updateShipToSchema.shape[field],
            ]),
        ]),
    ) as {
        [F in LegacyShipToField]: z.ZodUnion<
            [z.ZodLiteral<string>, (typeof updateShipToSchema.shape)[F]]
        >;
    };
    return updateShipToSchema.extend(shape);
}
