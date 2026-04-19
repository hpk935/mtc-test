import { Suspense } from 'react';
import { getInvoices } from '@/features/invoices/queries';
import {
  INVOICE_STATUSES,
  type InvoiceStatus,
} from '@/features/invoices/constants';
import { InvoicesHeader } from '@/features/invoices/components/invoices-header';
import { InvoiceTable } from '@/features/invoices/components/invoice-table';
import { DataTableSearch } from '@/components/data/data-table-search';
import { DataTableFilter } from '@/components/data/data-table-filter';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import { requirePermission } from '@/lib/auth';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = INVOICE_STATUSES.map((s) => ({
  label:
    s === 'partially_paid' ? 'Partial' : s.charAt(0).toUpperCase() + s.slice(1),
  value: s,
}));

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>;
}) {
  await requirePermission('invoices:view');
  const params = await searchParams;
  const search = params.search ?? '';
  const page = Math.max(1, Number(params.page) || 1);
  const status =
    params.status === 'all'
      ? undefined
      : (INVOICE_STATUSES as readonly string[]).includes(params.status ?? '')
        ? (params.status as InvoiceStatus)
        : 'open';

  const { invoices, totalCount, totalPages } = await getInvoices({
    search: search || undefined,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <InvoicesHeader />

      <Suspense fallback={null}>
        <div className="flex items-center gap-3">
          <DataTableSearch placeholder="Invoice #, order #, customer name, or PO #..." />
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
          label="invoices"
        />
        <InvoiceTable invoices={invoices} />
      </div>
    </div>
  );
}
