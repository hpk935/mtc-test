import { eq } from 'drizzle-orm';
import db from '@/lib/db';
import { customers, shipToAddresses } from './schema';
import { findCustomerByNumber, findShipToAddress } from './queries';
import type {
    CreateCustomerInput,
    UpdateCustomerInput,
    CreateShipToInput,
    UpdateShipToInput,
} from './validation';

function normalizeOptional(value: string | undefined): string | null {
    return value && value.trim() !== '' ? value : null;
}

export async function createCustomerRecord(input: CreateCustomerInput) {
    const existing = await findCustomerByNumber(input.customerNumber);
    if (existing) {
        return {
            success: false as const,
            error: 'A customer with this number already exists.',
        };
    }

    await db.insert(customers).values({
        customerNumber: input.customerNumber,
        customerName: input.customerName,
        primaryContactName: input.primaryContactName,
        billingAddress1: input.billingAddress1,
        billingAddress2: normalizeOptional(input.billingAddress2),
        billingCity: input.billingCity,
        billingStateCode: input.billingStateCode,
        billingPostalCode: input.billingPostalCode,
        countryCode: input.countryCode || 'US',
        mainPhone: input.mainPhone,
        phoneExtension: normalizeOptional(input.phoneExtension),
        faxNumber: normalizeOptional(input.faxNumber),
        mainEmail: input.mainEmail,
        taxId: normalizeOptional(input.taxId),
        termCode: input.termCode,
        territoryCode: input.territoryCode,
        salespersonCode: input.salespersonCode,
        defaultFreightTerm: input.defaultFreightTerm,
        accountStatus: input.accountStatus ?? 'active',
        accountOpenDate: input.accountOpenDate,
        customerNote: normalizeOptional(input.customerNote),
    });

    return { success: true as const, data: input.customerNumber };
}

export async function updateCustomerRecord(
    customerNumber: string,
    input: UpdateCustomerInput,
) {
    const existing = await findCustomerByNumber(customerNumber);
    if (!existing) {
        return { success: false as const, error: 'Customer not found.' };
    }

    await db
        .update(customers)
        .set({
            customerName: input.customerName,
            primaryContactName: input.primaryContactName,
            billingAddress1: input.billingAddress1,
            billingAddress2: normalizeOptional(input.billingAddress2),
            billingCity: input.billingCity,
            billingStateCode: input.billingStateCode,
            billingPostalCode: input.billingPostalCode,
            countryCode: input.countryCode || 'US',
            mainPhone: input.mainPhone,
            phoneExtension: normalizeOptional(input.phoneExtension),
            faxNumber: normalizeOptional(input.faxNumber),
            mainEmail: input.mainEmail,
            taxId: normalizeOptional(input.taxId),
            termCode: input.termCode,
            territoryCode: input.territoryCode,
            salespersonCode: input.salespersonCode,
            defaultFreightTerm: input.defaultFreightTerm,
            accountStatus: input.accountStatus ?? 'active',
            accountOpenDate: input.accountOpenDate,
            customerNote: normalizeOptional(input.customerNote),
            updatedAt: new Date(),
        })
        .where(eq(customers.customerNumber, customerNumber));

    return { success: true as const, data: undefined };
}

export async function createShipToRecord(input: CreateShipToInput) {
    const existing = await findShipToAddress(input.shipToId);
    if (existing) {
        return {
            success: false as const,
            error: 'A shipping address with this ID already exists.',
        };
    }

    await db.insert(shipToAddresses).values({
        shipToId: input.shipToId,
        customerNumber: input.customerNumber,
        locationName: input.locationName,
        locationStatus: input.locationStatus ?? 'active',
        address1: input.address1,
        address2: normalizeOptional(input.address2),
        city: input.city,
        stateCode: input.stateCode,
        postalCode: input.postalCode,
        countryCode: input.countryCode || 'US',
        contactName: normalizeOptional(input.contactName),
        mainPhone: normalizeOptional(input.mainPhone),
        isDefault: input.isDefault ?? false,
        customerNote: normalizeOptional(input.customerNote),
    });

    return { success: true as const, data: input.shipToId };
}

export async function updateShipToRecord(
    shipToId: string,
    input: UpdateShipToInput,
) {
    const existing = await findShipToAddress(shipToId);
    if (!existing) {
        return {
            success: false as const,
            error: 'Shipping address not found.',
        };
    }

    await db
        .update(shipToAddresses)
        .set({
            locationName: input.locationName,
            locationStatus: input.locationStatus ?? 'active',
            address1: input.address1,
            address2: normalizeOptional(input.address2),
            city: input.city,
            stateCode: input.stateCode,
            postalCode: input.postalCode,
            countryCode: input.countryCode || 'US',
            contactName: normalizeOptional(input.contactName),
            mainPhone: normalizeOptional(input.mainPhone),
            isDefault: input.isDefault ?? false,
            customerNote: normalizeOptional(input.customerNote),
            updatedAt: new Date(),
        })
        .where(eq(shipToAddresses.shipToId, shipToId));

    return { success: true as const, data: undefined };
}

export async function deleteShipToRecord(shipToId: string) {
    const existing = await findShipToAddress(shipToId);
    if (!existing) {
        return {
            success: false as const,
            error: 'Shipping address not found.',
        };
    }

    await db
        .delete(shipToAddresses)
        .where(eq(shipToAddresses.shipToId, shipToId));

    return { success: true as const, data: undefined };
}
