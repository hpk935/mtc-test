import { z } from 'zod/v4';
import { INVOICE_STATUSES } from './constants';

export const updateInvoiceStatusSchema = z.object({
    invoiceNumber: z.string().min(1, 'Invoice number is required.'),
    status: z.enum(INVOICE_STATUSES),
});

export type UpdateInvoiceStatusInput = z.infer<
    typeof updateInvoiceStatusSchema
>;
