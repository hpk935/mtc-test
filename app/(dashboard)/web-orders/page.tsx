import { Suspense } from 'react';
import { listWebOrders } from '@/features/web-store/queries';
import { WebOrderTable } from '@/features/web-store/components/web-order-table';
import { DataTableSearch } from '@/components/data/data-table-search';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import { requireAdmin } from '@/lib/auth';

const PAGE_SIZE = 20;

export default async function WebOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const search = params.search ?? '';
  const page = Math.max(1, Number(params.page) || 1);

  const { orders, totalCount, totalPages } = await listWebOrders({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Web Orders</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Orders placed on the online store
        </p>
      </div>

      <Suspense fallback={null}>
        <DataTableSearch placeholder="Order #, email, or name..." />
      </Suspense>

      <div className="rounded-lg border">
        <DataTablePagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          label="web orders"
        />
        <WebOrderTable orders={orders} />
      </div>
    </div>
  );
}
