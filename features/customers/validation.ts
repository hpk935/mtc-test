import { z } from 'zod/v4';
import { ACCOUNT_STATUSES } from './constants';

export const createCustomerSchema = z.object({
    customerNumber: z.string().min(1, 'Customer number is required').max(20),
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

export const updateCustomerSchema = createCustomerSchema.omit({
    customerNumber: true,
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
