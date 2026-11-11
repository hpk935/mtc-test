import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getLastPricesPaid } from '@/features/orders/queries';

// GET ?items=A&items=B → the price the customer last paid for each item,
// with the invoice it was billed on. Items never bought are left out.
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
    const itemNumbers = [
        ...new Set(
            request.nextUrl.searchParams
                .getAll('items')
                .map((item) => item.trim())
                .filter(Boolean),
        ),
    ];

    const data = await getLastPricesPaid(customerNumber, itemNumbers);

    return NextResponse.json({ success: true, data });
}
