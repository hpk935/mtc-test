import { Suspense } from 'react';
import { getCustomers } from '@/features/customers/queries';
import { CustomersHeader } from '@/features/customers/components/customers-header';
import { CustomerTable } from '@/features/customers/components/customer-table';
import { DataTableSearch } from '@/components/data/data-table-search';
import { DataTablePagination } from '@/components/data/data-table-pagination';

const PAGE_SIZE = 20;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? '';
  const page = Math.max(1, Number(params.page) || 1);

  const { customers, totalCount, totalPages } = await getCustomers({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <CustomersHeader />

      <Suspense fallback={null}>
        <DataTableSearch placeholder="Search by name or email..." />
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
