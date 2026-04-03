import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getProducts } from '@/features/products/queries';

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
    const pageSize = Math.min(
        100,
        Math.max(1, Number(searchParams.get('pageSize') ?? 20)),
    );

    const result = await getProducts({
        search,
        discontinued: false,
        page: 1,
        pageSize,
    });

    return NextResponse.json({ success: true, data: result });
}
