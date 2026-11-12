import { Suspense } from 'react';
import { listWebCarts } from '@/features/web-store/queries';
import {
  WEB_CART_STATUSES,
  WEB_CART_STATUS_LABEL,
  type WebCartStatus,
} from '@/features/web-store/cart-status';
import { WebCartTable } from '@/features/web-store/components/web-cart-table';
import { DataTableSearch } from '@/components/data/data-table-search';
import { DataTableFilter } from '@/components/data/data-table-filter';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import { requireAdmin } from '@/lib/auth';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = WEB_CART_STATUSES.map((s) => ({
  label: WEB_CART_STATUS_LABEL[s],
  value: s,
}));

export default async function WebCartsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const search = params.search ?? '';
  const page = Math.max(1, Number(params.page) || 1);
  const status =
    params.status === 'all'
      ? undefined
      : (WEB_CART_STATUSES as readonly string[]).includes(params.status ?? '')
        ? (params.status as WebCartStatus)
        : 'active';

  const { carts, totalCount, totalPages } = await listWebCarts({
    status,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Web Carts</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Carts shoppers have started on the online store
        </p>
      </div>

      <Suspense fallback={null}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DataTableSearch placeholder="Customer email..." />
          <DataTableFilter
            options={STATUS_OPTIONS}
            paramName="status"
            defaultValue="active"
            allLabel="All Statuses"
          />
        </div>
      </Suspense>

      <div className="rounded-lg border">
        <DataTablePagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          label="web carts"
        />
        <WebCartTable carts={carts} />
      </div>
    </div>
  );
}
