import { z } from 'zod/v4';
import { ACCOUNT_STATUSES, LOCATION_STATUSES } from './constants';

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
    billingPostalCode: z.string().min(1, 'Postal code is required').max(20),
    countryCode: z.string().max(5).optional().default('US'),
    mainPhone: z.string().min(1, 'Phone number is required').max(20),
    phoneExtension: z.string().max(10).optional().default(''),
    faxNumber: z.string().max(20).optional().default(''),
    mainEmail: z.email('Invalid email address'),
    taxId: z.string().max(20).optional().default(''),
    termCode: z.string().min(1, 'Term code is required').max(10),
    territoryCode: z.string().min(1, 'Territory code is required').max(20),
    salespersonCode: z.string().min(1, 'Salesperson is required').max(10),
    defaultFreightTerm: z.string().min(1, 'Freight term is required').max(50),
    accountStatus: z.enum(ACCOUNT_STATUSES).optional().default('active'),
    accountOpenDate: z.string().min(1, 'Account open date is required'),
    customerNote: z.string().optional().default(''),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const createCustomerWithShipToSchema = createCustomerSchema.extend({
    sameAsBilling: z
        .string()
        .optional()
        .transform((v) => v === 'on' || v === 'true'),
    shipLocationName: z.string().min(1, 'Location name is required').max(255),
    shipAddress1: z.string().max(255).optional().default(''),
    shipAddress2: z.string().max(255).optional().default(''),
    shipCity: z.string().max(100).optional().default(''),
    shipStateCode: z.string().max(10).optional().default(''),
    shipPostalCode: z.string().max(20).optional().default(''),
    shipCountryCode: z.string().max(5).optional().default('US'),
    shipContactName: z.string().max(255).optional().default(''),
    shipPhone: z.string().max(20).optional().default(''),
});

export type CreateCustomerWithShipToInput = z.infer<
    typeof createCustomerWithShipToSchema
>;

export const updateCustomerSchema = createCustomerSchema;

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const createShipToSchema = z.object({
    customerNumber: z.string().min(1, 'Customer number is required').max(20),
    locationName: z.string().min(1, 'Location name is required').max(255),
    locationStatus: z.enum(LOCATION_STATUSES).optional().default('active'),
    address1: z.string().min(1, 'Address is required').max(255),
    address2: z.string().max(255).optional().default(''),
    city: z.string().min(1, 'City is required').max(100),
    stateCode: z.string().min(1, 'State is required').max(10),
    postalCode: z.string().min(1, 'Postal code is required').max(20),
    countryCode: z.string().max(5).optional().default('US'),
    contactName: z.string().max(255).optional().default(''),
    mainPhone: z.string().max(20).optional().default(''),
    isDefault: z
        .string()
        .optional()
        .transform((v) => v === 'on' || v === 'true'),
    customerNote: z.string().optional().default(''),
});

export type CreateShipToInput = z.infer<typeof createShipToSchema>;

export const updateShipToSchema = createShipToSchema.omit({
    customerNumber: true,
});

export type UpdateShipToInput = z.infer<typeof updateShipToSchema>;
