import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCustomerAvailableCredit } from '@/features/invoices/queries';

// GET ?excludeOrder=160581 → credit the customer can still apply to an
// order. Pass the order being edited so its own applied credit counts.
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
    const excludeOrder =
        request.nextUrl.searchParams.get('excludeOrder')?.trim() || undefined;

    const available = await getCustomerAvailableCredit(
        customerNumber,
        excludeOrder,
    );

    return NextResponse.json({ success: true, data: { available } });
}
