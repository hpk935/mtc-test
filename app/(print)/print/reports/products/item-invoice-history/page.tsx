import { notFound } from 'next/navigation';
import {
  ReportPrintShell,
  ReportPrintStats,
} from '@/features/reports/components/report-print-shell';
import { parseVisibleColumns } from '@/features/reports/components/report-columns';
import { getItemInvoiceHistory } from '@/features/reports/products/queries';
import { itemInvoiceHistoryFiltersSchema } from '@/features/reports/products/validation';
import {
  ITEM_INVOICE_HISTORY_COLUMNS,
  ItemInvoiceHistoryTable,
} from '@/features/reports/products/components/item-invoice-history-table';
import { findCustomerByNumber } from '@/features/customers/queries';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function ItemInvoiceHistoryPrintPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const filters = itemInvoiceHistoryFiltersSchema.parse(raw);
  if (!filters.itemNumber) {
    notFound();
  }
  const visibleColumns = parseVisibleColumns(
    raw.cols,
    ITEM_INVOICE_HISTORY_COLUMNS,
  );

  const [data, customer] = await Promise.all([
    getItemInvoiceHistory({
      ...filters,
      itemNumber: filters.itemNumber,
      page: 1,
      pageSize: 10_000,
    }),
    filters.customerNumber
      ? findCustomerByNumber(filters.customerNumber)
      : Promise.resolve(null),
  ]);

  const meta = [
    data.product && {
      label: 'Item',
      value: `${data.product.itemNumber} — ${data.product.description}`,
    },
    customer && {
      label: 'Customer',
      value: `${customer.customerName} (${customer.customerNumber})`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <ReportPrintShell
      title="Item Invoice History"
      subtitle={`${formatDate(data.periodRange.startDate)} – ${formatDate(
        data.periodRange.endDate,
      )}`}
      meta={meta}>
      <ReportPrintStats
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
          },
          {
            label: 'Last Sale',
            value: data.stats.lastSale ? formatDate(data.stats.lastSale) : '—',
          },
        ]}
      />
      <ItemInvoiceHistoryTable
        rows={data.rows}
        linkInvoices={false}
        visibleColumns={visibleColumns}
      />
    </ReportPrintShell>
  );
}
