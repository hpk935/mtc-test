import { Suspense } from 'react';
import { getProducts } from '@/features/products/queries';
import { ProductsHeader } from '@/features/products/components/products-header';
import { ProductTable } from '@/features/products/components/product-table';
import { DataTableSearch } from '@/components/data/data-table-search';
import { DataTableFilter } from '@/components/data/data-table-filter';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import { requirePermission } from '@/lib/auth';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Discontinued', value: 'discontinued' },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>;
}) {
  const session = await requirePermission('products:view');
  const params = await searchParams;
  const search = params.search ?? '';
  const page = Math.max(1, Number(params.page) || 1);
  const discontinued =
    params.status === 'discontinued'
      ? true
      : params.status === 'all'
        ? undefined
        : false;

  const { products, totalCount, totalPages } = await getProducts({
    search: search || undefined,
    discontinued,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <ProductsHeader isAdmin={session.role === 'admin'} />

      <Suspense fallback={null}>
        <div className="flex items-center gap-3">
          <DataTableSearch placeholder="Item number, description, or UPC..." />
          <DataTableFilter
            options={STATUS_OPTIONS}
            paramName="status"
            defaultValue="active"
            allLabel="All Products"
          />
        </div>
      </Suspense>

      <div className="rounded-lg border">
        <DataTablePagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          label="products"
        />
        <ProductTable products={products} />
      </div>
    </div>
  );
}
