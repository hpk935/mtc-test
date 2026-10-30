import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { getCustomers } from '@/features/customers/queries';
import { createCustomerSchema } from '@/features/customers/validation';
import {
    createCustomerRecord,
    generateCustomerNumber,
} from '@/features/customers/service';

export async function GET(request: NextRequest) {
    try {
        await requireAuth();
    } catch {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 },
        );
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') ?? undefined;
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(
        100,
        Math.max(1, Number(searchParams.get('pageSize') ?? 20)),
    );

    const result = await getCustomers({ search, page, pageSize });

    return NextResponse.json({ success: true, data: result });
}

export async function POST(request: NextRequest) {
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

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: 'Invalid JSON body.' },
            { status: 400 },
        );
    }

    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return NextResponse.json(
            { success: false, error: firstError ?? 'Validation failed.' },
            { status: 400 },
        );
    }

    const result = await createCustomerRecord({
        ...parsed.data,
        customerNumber: await generateCustomerNumber(),
    });
    if (!result.success) {
        return NextResponse.json(result, {
            status: 'invalidInput' in result ? 400 : 409,
        });
    }

    return NextResponse.json(result, { status: 201 });
}
