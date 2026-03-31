import { Suspense } from 'react';
import { getCustomers } from '@/features/customers/queries';
import {
  ACCOUNT_STATUSES,
  type AccountStatus,
} from '@/features/customers/constants';
import { CustomersHeader } from '@/features/customers/components/customers-header';
import { CustomerTable } from '@/features/customers/components/customer-table';
import { DataTableSearch } from '@/components/data/data-table-search';
import { DataTableFilter } from '@/components/data/data-table-filter';
import { DataTablePagination } from '@/components/data/data-table-pagination';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = ACCOUNT_STATUSES.map((s) => ({
  label: s === 'on_hold' ? 'On Hold' : s.charAt(0).toUpperCase() + s.slice(1),
  value: s,
}));

export default async function CustomersPage({
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
      : (ACCOUNT_STATUSES as readonly string[]).includes(params.status ?? '')
        ? (params.status as AccountStatus)
        : 'active';

  const { customers, totalCount, totalPages } = await getCustomers({
    search: search || undefined,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <CustomersHeader />

      <Suspense fallback={null}>
        <div className="flex items-center gap-3">
          <DataTableSearch placeholder="Name, contact, zip, or customer #..." />
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
        />
        <CustomerTable customers={customers} />
      </div>
    </div>
  );
}
