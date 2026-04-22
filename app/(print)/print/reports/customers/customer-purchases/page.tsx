import { findCustomerByNumber } from '@/features/customers/queries';
import {
  ReportPrintShell,
  ReportPrintStats,
} from '@/features/reports/components/report-print-shell';
import { parseVisibleColumns } from '@/features/reports/components/report-columns';
import {
  getPurchaseHistoryAllCustomers,
  getPurchaseHistoryPerCustomer,
} from '@/features/reports/customers/queries';
import { customerPurchasesFiltersSchema } from '@/features/reports/customers/validation';
import {
  PURCHASE_CUSTOMERS_COLUMNS,
  PURCHASE_ITEMS_COLUMNS,
  PurchaseCustomersTable,
  PurchaseItemsTable,
} from '@/features/reports/customers/components/purchase-tables';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function CustomerPurchasesPrintPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const filters = customerPurchasesFiltersSchema.parse(raw);
  const itemCols = parseVisibleColumns(raw.itemCols, PURCHASE_ITEMS_COLUMNS);
  const customerCols = parseVisibleColumns(
    raw.custCols,
    PURCHASE_CUSTOMERS_COLUMNS,
  );

  if (filters.view === 'per-customer') {
    if (!filters.customerNumber) {
      return (
        <ReportPrintShell title="Customer Purchase History">
          <p className="text-gray-500">No customer selected.</p>
        </ReportPrintShell>
      );
    }

    const data = await getPurchaseHistoryPerCustomer({
      ...filters,
      customerNumber: filters.customerNumber,
      itemPage: 1,
      itemPageSize: 10_000,
    });
    const customer =
      data.customer ?? (await findCustomerByNumber(filters.customerNumber));

    return (
      <ReportPrintShell
        title="Customer Purchase History"
        subtitle={
          customer
            ? `${customer.customerName} (${customer.customerNumber})`
            : filters.customerNumber
        }
        meta={[
          {
            label: 'Range',
            value: `${formatDate(data.periodRange.startDate)} – ${formatDate(data.periodRange.endDate)}`,
          },
        ]}>
        <ReportPrintStats
          items={[
            { label: 'Orders', value: data.stats.orderCount },
            { label: 'Invoices', value: data.stats.invoiceCount },
            {
              label: 'Total Qty',
              value: data.stats.totalQty.toLocaleString(),
            },
            {
              label: 'Total',
              value: formatCurrency(data.stats.totalAmount),
            },
          ]}
        />
        <PurchaseItemsTable rows={data.rows.rows} visibleColumns={itemCols} />
      </ReportPrintShell>
    );
  }

  const data = await getPurchaseHistoryAllCustomers({
    ...filters,
    page: 1,
    pageSize: 10_000,
  });

  return (
    <ReportPrintShell
      title="Customer Purchase History — All Customers"
      subtitle={`${data.stats.customerCount.toLocaleString()} customers · ${formatDate(data.periodRange.startDate)} – ${formatDate(data.periodRange.endDate)}`}
      meta={
        [
          filters.salesperson && {
            label: 'Salesperson',
            value: filters.salesperson,
          },
          filters.territory && {
            label: 'Territory',
            value: filters.territory,
          },
        ].filter(Boolean) as { label: string; value: string }[]
      }>
      <ReportPrintStats
        items={[
          { label: 'Customers', value: data.stats.customerCount },
          { label: 'Orders', value: data.stats.orderCount },
          { label: 'Invoices', value: data.stats.invoiceCount },
          {
            label: 'Total Qty',
            value: data.stats.totalQty.toLocaleString(),
          },
          {
            label: 'Total',
            value: formatCurrency(data.stats.totalAmount),
          },
        ]}
      />
      <PurchaseCustomersTable
        rows={data.rows}
        linkCustomers={false}
        visibleColumns={customerCols}
      />
    </ReportPrintShell>
  );
}
