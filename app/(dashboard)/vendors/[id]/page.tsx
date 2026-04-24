import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import { findVendorById, getPurchaseOrders } from '@/features/vendors/queries';
import { VendorForm } from '@/features/vendors/components/vendor-form';
import { PurchaseOrdersTable } from '@/features/vendors/components/purchase-orders-table';
import { requirePermission } from '@/lib/auth';

const PAGE_SIZE = 10;

export default async function VendorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ poPage?: string }>;
}) {
  await requirePermission('vendors:view');
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const vendor = await findVendorById(numericId);
  if (!vendor) notFound();

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.poPage) || 1);
  const { purchaseOrders, totalCount, totalPages } = await getPurchaseOrders({
    vendorId: vendor.id,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex w-full flex-col gap-8">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/vendors">
          <ArrowLeft className="mr-2 size-4" />
          Back to Vendors
        </Link>
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{vendor.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {vendor.vendorCode}
          </p>
        </div>
        <Button asChild>
          <Link href={`/purchase-orders/new?vendorId=${vendor.id}`}>
            New Purchase Order
          </Link>
        </Button>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Details</h2>
        <VendorForm vendor={vendor} mode="edit" />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Purchase Orders</h2>
        </div>
        <div className="rounded-lg border">
          <Suspense fallback={null}>
            <DataTablePagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              label="purchase orders"
              paramName="poPage"
            />
          </Suspense>
          <PurchaseOrdersTable rows={purchaseOrders} showVendor={false} />
        </div>
      </section>
    </div>
  );
}
