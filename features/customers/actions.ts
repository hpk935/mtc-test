'use server';

import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { customers } from './schema';
import { findCustomerByNumber } from './queries';
import { createCustomerSchema } from './validation';
import type { ActionResult } from '@/types';

export async function createCustomer(
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    const raw = Object.fromEntries(formData);
    const parsed = createCustomerSchema.safeParse(raw);

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return {
            success: false,
            error: firstError ?? 'Please check all fields and try again.',
        };
    }

    const data = parsed.data;

    const existing = await findCustomerByNumber(data.customerNumber);
    if (existing) {
        return {
            success: false,
            error: 'A customer with this number already exists.',
        };
    }

    await db.insert(customers).values({
        customerNumber: data.customerNumber,
        customerName: data.customerName,
        primaryContactName: data.primaryContactName,
        billingAddress1: data.billingAddress1,
        billingAddress2: data.billingAddress2 || null,
        billingCity: data.billingCity,
        billingStateCode: data.billingStateCode,
        billingPostalCode: data.billingPostalCode,
        countryCode: data.countryCode || 'US',
        mainPhone: data.mainPhone,
        phoneExtension: data.phoneExtension || null,
        faxNumber: data.faxNumber || null,
        mainEmail: data.mainEmail,
        taxId: data.taxId || null,
        termCode: data.termCode,
        territoryCode: data.territoryCode,
        salespersonCode: data.salespersonCode,
        defaultFreightTerm: data.defaultFreightTerm,
        accountStatus: data.accountStatus ?? 'active',
        accountOpenDate: data.accountOpenDate,
        customerNote: data.customerNote || null,
    });

    redirect(`/customers`);
}
