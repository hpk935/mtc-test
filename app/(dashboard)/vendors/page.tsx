import { Suspense } from 'react';
import { getVendors } from '@/features/vendors/queries';
import { VENDOR_TYPES } from '@/features/vendors/constants';
import { VendorsHeader } from '@/features/vendors/components/vendors-header';
import { VendorTable } from '@/features/vendors/components/vendor-table';
import { DataTableSearch } from '@/components/data/data-table-search';
import { DataTableFilter } from '@/components/data/data-table-filter';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import { requirePermission } from '@/lib/auth';

const PAGE_SIZE = 20;

const TYPE_OPTIONS = VENDOR_TYPES.map((t) => ({
  label: t === 'CS' ? 'Cost of Sales' : 'Overhead',
  value: t,
}));

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    type?: string;
    status?: string;
  }>;
}) {
  const session = await requirePermission('vendors:view');
  const params = await searchParams;
  const search = params.search ?? '';
  const page = Math.max(1, Number(params.page) || 1);

  const vendorType =
    params.type === 'CS' || params.type === 'CO' ? params.type : undefined;

  const isActive =
    params.status === 'inactive'
      ? false
      : params.status === 'all'
        ? undefined
        : true;

  const { vendors, totalCount, totalPages } = await getVendors({
    search: search || undefined,
    vendorType,
    isActive,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <VendorsHeader isAdmin={session.role === 'admin'} />

      <Suspense fallback={null}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DataTableSearch placeholder="Code, name, contact, or city…" />
          <DataTableFilter
            options={TYPE_OPTIONS}
            paramName="type"
            allLabel="All Types"
          />
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
          label="vendors"
        />
        <VendorTable vendors={vendors} />
      </div>
    </div>
  );
}
