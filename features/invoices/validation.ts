import { z } from 'zod/v4';
import { INVOICE_STATUSES } from './constants';

export const updateInvoiceStatusSchema = z.object({
    invoiceNumber: z.string().min(1, 'Invoice number is required.'),
    status: z.enum(INVOICE_STATUSES),
});

export type UpdateInvoiceStatusInput = z.infer<
    typeof updateInvoiceStatusSchema
>;

export const applyPaymentSchema = z.object({
    invoiceNumber: z.string().min(1, 'Invoice number is required.'),
    paymentAmount: z
        .string()
        .min(1, 'Payment amount is required.')
        .refine(
            (v) => {
                const n = parseFloat(v);
                return !isNaN(n) && n > 0;
            },
            { message: 'Payment amount must be greater than zero.' },
        ),
    paymentDate: z
        .string()
        .min(1, 'Payment date is required.')
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format.'),
    paymentRef: z.string().optional(),
});

export type ApplyPaymentInput = z.infer<typeof applyPaymentSchema>;
