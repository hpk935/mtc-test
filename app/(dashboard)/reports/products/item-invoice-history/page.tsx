import { Suspense } from 'react';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import { ReportPageShell } from '@/features/reports/components/report-page-shell';
import { ReportStats } from '@/features/reports/components/report-stats';
import { ReportPrintButton } from '@/features/reports/components/report-print-button';
import { ReportDateInput } from '@/features/reports/components/report-date-input';
import { ReportCustomerPicker } from '@/features/reports/components/report-customer-picker';
import { ReportItemPicker } from '@/features/reports/components/report-item-picker';
import { ReportColumnsFilter } from '@/features/reports/components/report-columns-filter';
import { parseVisibleColumns } from '@/features/reports/components/report-columns';
import { getItemInvoiceHistory } from '@/features/reports/products/queries';
import { itemInvoiceHistoryFiltersSchema } from '@/features/reports/products/validation';
import {
  ITEM_INVOICE_HISTORY_COLUMNS,
  ItemInvoiceHistoryTable,
} from '@/features/reports/products/components/item-invoice-history-table';
import { findCustomerByNumber } from '@/features/customers/queries';
import { findProductByItemNumber } from '@/features/products/queries';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function ItemInvoiceHistoryReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const filters = itemInvoiceHistoryFiltersSchema.parse(raw);
  const visibleColumns = parseVisibleColumns(
    raw.cols,
    ITEM_INVOICE_HISTORY_COLUMNS,
  );

  const [initialProduct, initialCustomer] = await Promise.all([
    filters.itemNumber
      ? findProductByItemNumber(filters.itemNumber)
      : Promise.resolve(null),
    filters.customerNumber
      ? findCustomerByNumber(filters.customerNumber)
      : Promise.resolve(null),
  ]);

  return (
    <ReportPageShell
      title="Item Invoice History"
      description="Every invoice that includes the selected item over a date range, with quantities, pricing, and buyer detail.">
      <Suspense fallback={null}>
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportItemPicker
            initialItemNumber={filters.itemNumber}
            initialDescription={initialProduct?.description}
            className="lg:col-span-2"
          />
          <ReportDateInput paramName="startDate" label="From" />
          <ReportDateInput paramName="endDate" label="To" />
        </div>
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportCustomerPicker
            initialCustomerNumber={filters.customerNumber}
            initialCustomerName={initialCustomer?.customerName}
            label="Filter by customer (optional)"
            className="lg:col-span-2"
          />
        </div>
      </Suspense>

      {!filters.itemNumber ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Pick an item above to see its invoice history.
        </div>
      ) : (
        <ItemResults
          filters={filters}
          visibleColumns={visibleColumns}
          productDescription={initialProduct?.description ?? null}
        />
      )}
    </ReportPageShell>
  );
}

async function ItemResults({
  filters,
  visibleColumns,
  productDescription,
}: {
  filters: ReturnType<typeof itemInvoiceHistoryFiltersSchema.parse>;
  visibleColumns?: Set<string>;
  productDescription: string | null;
}) {
  const data = await getItemInvoiceHistory({
    ...filters,
    itemNumber: filters.itemNumber as string,
  });

  return (
    <>
      <ReportStats
        items={[
          {
            label: 'Invoices',
            value: data.stats.invoiceCount.toLocaleString(),
          },
          {
            label: 'Customers',
            value: data.stats.customerCount.toLocaleString(),
          },
          {
            label: 'Qty Shipped',
            value: data.stats.totalQty.toLocaleString(),
          },
          {
            label: 'Total Sales',
            value: formatCurrency(data.stats.totalAmount),
          },
          {
            label: 'Avg Price',
            value: formatCurrency(data.stats.avgPrice),
            hint: 'Per unit shipped',
          },
          {
            label: 'Last Sale',
            value: data.stats.lastSale ? formatDate(data.stats.lastSale) : '—',
          },
        ]}
        className="xl:grid-cols-6"
      />

      <div className="rounded-lg border">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div className="text-sm">
            <span className="font-semibold">{filters.itemNumber}</span>
            {productDescription && (
              <span className="text-muted-foreground">
                {' '}
                · {productDescription}
              </span>
            )}
            <span className="text-muted-foreground block text-xs">
              {formatDate(data.periodRange.startDate)} –{' '}
              {formatDate(data.periodRange.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ReportColumnsFilter columns={ITEM_INVOICE_HISTORY_COLUMNS} />
            <ReportPrintButton path="/reports/products/item-invoice-history" />
          </div>
        </div>
        <DataTablePagination
          currentPage={data.page}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          pageSize={data.pageSize}
          label="invoice lines"
        />
        <ItemInvoiceHistoryTable
          rows={data.rows}
          visibleColumns={visibleColumns}
        />
      </div>
    </>
  );
}
