import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { findCustomerByNumber } from '@/features/customers/queries';
import { updateCustomerSchemaFor } from '@/features/customers/validation';
import { updateCustomerRecord } from '@/features/customers/service';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ customerNumber: string }> },
) {
    try {
        await requireAuth();
    } catch {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 },
        );
    }

    const { customerNumber } = await params;
    const customer = await findCustomerByNumber(customerNumber);

    if (!customer) {
        return NextResponse.json(
            { success: false, error: 'Customer not found.' },
            { status: 404 },
        );
    }

    return NextResponse.json({ success: true, data: customer });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ customerNumber: string }> },
) {
    try {
        await requireAdmin();
    } catch (error) {
        const forbidden =
            error instanceof Error && error.message === 'Forbidden';
        return NextResponse.json(
            { success: false, error: forbidden ? 'Forbidden' : 'Unauthorized' },
            { status: forbidden ? 403 : 401 },
        );
    }

    const { customerNumber } = await params;
    const existing = await findCustomerByNumber(customerNumber);
    if (!existing) {
        return NextResponse.json(
            { success: false, error: 'Customer not found.' },
            { status: 404 },
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: 'Invalid JSON body.' },
            { status: 400 },
        );
    }

    const parsed = updateCustomerSchemaFor(existing).safeParse(body);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return NextResponse.json(
            { success: false, error: firstError ?? 'Validation failed.' },
            { status: 400 },
        );
    }

    const result = await updateCustomerRecord(customerNumber, parsed.data);
    if (!result.success) {
        return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
}
