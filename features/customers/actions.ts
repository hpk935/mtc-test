'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import {
    createCustomerWithShipToSchema,
    updateCustomerSchema,
    createShipToSchema,
    updateShipToSchema,
} from './validation';
import {
    createCustomerRecord,
    generateCustomerNumber,
    generateShipToId,
    updateCustomerRecord,
    createShipToRecord,
    updateShipToRecord,
    deleteShipToRecord,
} from './service';
import type { ActionResult } from '@/types';

export async function createCustomer(
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const raw = Object.fromEntries(formData);
    const parsed = createCustomerWithShipToSchema.safeParse(raw);

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return {
            success: false,
            error: firstError ?? 'Please check all fields and try again.',
        };
    }

    const {
        sameAsBilling,
        shipLocationName,
        shipAddress1,
        shipAddress2,
        shipCity,
        shipStateCode,
        shipPostalCode,
        shipCountryCode,
        shipContactName,
        shipPhone,
        ...customerData
    } = parsed.data;

    const customerNumber = await generateCustomerNumber();

    // Validate shipping address fields when not same as billing
    if (!sameAsBilling) {
        if (!shipAddress1) {
            return {
                success: false,
                error: 'Shipping street address is required.',
            };
        }
        if (!shipCity) {
            return { success: false, error: 'Shipping city is required.' };
        }
        if (!shipStateCode) {
            return { success: false, error: 'Shipping state is required.' };
        }
        if (!shipPostalCode) {
            return {
                success: false,
                error: 'Shipping postal code is required.',
            };
        }
    }

    const customerResult = await createCustomerRecord({
        ...customerData,
        customerNumber,
    });
    if (!customerResult.success) {
        return customerResult;
    }

    const shipToResult = await createShipToRecord({
        shipToId: await generateShipToId(),
        customerNumber,
        locationName: shipLocationName,
        locationStatus: 'active',
        address1: sameAsBilling ? customerData.billingAddress1 : shipAddress1,
        address2: sameAsBilling
            ? (customerData.billingAddress2 ?? '')
            : shipAddress2,
        city: sameAsBilling ? customerData.billingCity : shipCity,
        stateCode: sameAsBilling
            ? customerData.billingStateCode
            : shipStateCode,
        postalCode: sameAsBilling
            ? customerData.billingPostalCode
            : shipPostalCode,
        countryCode: sameAsBilling
            ? (customerData.countryCode ?? 'US')
            : (shipCountryCode ?? 'US'),
        contactName: shipContactName,
        mainPhone: shipPhone,
        isFavorite: true,
        customerNote: '',
    });

    if (!shipToResult.success) {
        return shipToResult;
    }

    redirect('/customers');
}

export async function updateCustomer(
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const customerNumber = formData.get('customerNumber') as string;
    if (!customerNumber) {
        return { success: false, error: 'Customer number is required.' };
    }

    const raw = Object.fromEntries(formData);
    const parsed = updateCustomerSchema.safeParse(raw);

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return {
            success: false,
            error: firstError ?? 'Please check all fields and try again.',
        };
    }

    const result = await updateCustomerRecord(customerNumber, parsed.data);
    if (!result.success) {
        return result;
    }

    revalidatePath(`/customers/${customerNumber}`);
    revalidatePath('/customers');

    return { success: true, data: undefined };
}

export async function createShipTo(
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const raw = Object.fromEntries(formData);
    const parsed = createShipToSchema.safeParse(raw);

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return {
            success: false,
            error: firstError ?? 'Please check all fields and try again.',
        };
    }

    const result = await createShipToRecord({
        shipToId: await generateShipToId(),
        ...parsed.data,
    });
    if (!result.success) {
        return result;
    }

    revalidatePath(`/customers/${parsed.data.customerNumber}`);
    return { success: true, data: undefined };
}

export async function updateShipTo(
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const shipToId = formData.get('shipToId') as string;
    const customerNumber = formData.get('customerNumber') as string;
    if (!shipToId || !customerNumber) {
        return {
            success: false,
            error: 'Ship-to ID and customer number are required.',
        };
    }

    const raw = Object.fromEntries(formData);
    const parsed = updateShipToSchema.safeParse(raw);

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return {
            success: false,
            error: firstError ?? 'Please check all fields and try again.',
        };
    }

    const result = await updateShipToRecord(shipToId, parsed.data);
    if (!result.success) {
        return result;
    }

    revalidatePath(`/customers/${customerNumber}`);
    return { success: true, data: undefined };
}

export async function deleteShipTo(formData: FormData): Promise<ActionResult> {
    await requireAdmin();

    const shipToId = formData.get('shipToId') as string;
    const customerNumber = formData.get('customerNumber') as string;
    if (!shipToId || !customerNumber) {
        return {
            success: false,
            error: 'Ship-to ID and customer number are required.',
        };
    }

    const result = await deleteShipToRecord(shipToId);
    if (!result.success) {
        return result;
    }

    revalidatePath(`/customers/${customerNumber}`);
    return { success: true, data: undefined };
}
