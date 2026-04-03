import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
    getShipToAddresses,
    countShipToAddresses,
} from '@/features/customers/queries';

export async function GET(
    request: NextRequest,
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
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') ?? undefined;
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true';
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(
        100,
        Math.max(1, Number(searchParams.get('pageSize') ?? 20)),
    );
    const offset = (page - 1) * pageSize;

    const [{ rows: addresses, filteredTotal }, total] = await Promise.all([
        getShipToAddresses(customerNumber, {
            search,
            limit: pageSize,
            offset,
            favoritesOnly,
        }),
        countShipToAddresses(customerNumber),
    ]);

    return NextResponse.json({
        success: true,
        data: addresses,
        total,
        filteredTotal,
        page,
        pageSize,
        totalPages: Math.ceil(filteredTotal / pageSize),
    });
}
