import Link from 'next/link';
import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPurchaseOrders } from '@/features/vendors/queries';
import { PO_STATUSES, PO_STATUS_LABEL } from '@/features/vendors/constants';
import type { PurchaseOrderStatus } from '@/features/vendors/constants';
import { PurchaseOrdersTable } from '@/features/vendors/components/purchase-orders-table';
import { DataTableFilter } from '@/components/data/data-table-filter';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import { requirePermission } from '@/lib/auth';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = PO_STATUSES.map((s) => ({
  label: PO_STATUS_LABEL[s],
  value: s,
}));

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  await requirePermission('vendors:view');
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status =
    params.status && (PO_STATUSES as readonly string[]).includes(params.status)
      ? (params.status as PurchaseOrderStatus)
      : undefined;

  const { purchaseOrders, totalCount, totalPages } = await getPurchaseOrders({
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Inventory replenishment from vendors.
          </p>
        </div>
        <Button asChild>
          <Link href="/purchase-orders/new">
            <Plus className="mr-2 size-4" />
            New Purchase Order
          </Link>
        </Button>
      </div>

      <Suspense fallback={null}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DataTableFilter
            options={STATUS_OPTIONS}
            paramName="status"
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
          label="purchase orders"
        />
        <PurchaseOrdersTable rows={purchaseOrders} />
      </div>
    </div>
  );
}
