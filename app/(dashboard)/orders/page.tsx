import { Suspense } from 'react';
import { getOrders } from '@/features/orders/queries';
import { ORDER_STATUSES, type OrderStatus } from '@/features/orders/constants';
import { OrdersHeader } from '@/features/orders/components/orders-header';
import { OrderTable } from '@/features/orders/components/order-table';
import { DataTableSearch } from '@/components/data/data-table-search';
import { DataTableFilter } from '@/components/data/data-table-filter';
import { DataTablePagination } from '@/components/data/data-table-pagination';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = ORDER_STATUSES.map((s) => ({
  label: s.charAt(0).toUpperCase() + s.slice(1),
  value: s,
}));

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? '';
  const page = Math.max(1, Number(params.page) || 1);
  const status =
    params.status === 'all'
      ? undefined
      : (ORDER_STATUSES as readonly string[]).includes(params.status ?? '')
        ? (params.status as OrderStatus)
        : 'open';

  const { orders, totalCount, totalPages } = await getOrders({
    search: search || undefined,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <OrdersHeader />

      <Suspense fallback={null}>
        <div className="flex items-center gap-3">
          <DataTableSearch placeholder="Order #, customer name, PO #, or ship-to..." />
          <DataTableFilter
            options={STATUS_OPTIONS}
            paramName="status"
            defaultValue="open"
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
          label="orders"
        />
        <OrderTable orders={orders} />
      </div>
    </div>
  );
}
