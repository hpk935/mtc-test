import { findCustomerByNumber } from '@/features/customers/queries';
import {
  ReportPrintShell,
  ReportPrintStats,
} from '@/features/reports/components/report-print-shell';
import { parseVisibleColumns } from '@/features/reports/components/report-columns';
import {
  CUSTOMER_INVOICES_COLUMNS,
  CustomerInvoiceList,
} from '@/features/reports/customers/components/customer-invoice-tables';
import {
  INVOICE_SUMMARY_ALL_COLUMNS,
  InvoiceSummaryAllTable,
} from '@/features/reports/customers/components/invoice-summary-all-table';
import {
  getInvoiceSummaryAllCustomers,
  getInvoiceSummaryPerCustomer,
} from '@/features/reports/customers/queries';
import { customerInvoicesFiltersSchema } from '@/features/reports/customers/validation';
import { formatCurrency } from '@/lib/utils';

export default async function CustomerInvoicesPrintPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const filters = customerInvoicesFiltersSchema.parse(raw);
  const invoiceCols = parseVisibleColumns(
    raw.invCols,
    CUSTOMER_INVOICES_COLUMNS,
  );
  const allCustomersCols = parseVisibleColumns(
    raw.allCols,
    INVOICE_SUMMARY_ALL_COLUMNS,
  );

  if (filters.view === 'per-customer') {
    if (!filters.customerNumber) {
      return (
        <ReportPrintShell title="Customer Invoice Summary">
          <p className="text-gray-500">No customer selected.</p>
        </ReportPrintShell>
      );
    }

    const data = await getInvoiceSummaryPerCustomer({
      ...filters,
      customerNumber: filters.customerNumber,
      invPage: 1,
      invPageSize: 10_000,
    });
    const customer =
      data.customer ?? (await findCustomerByNumber(filters.customerNumber));

    return (
      <ReportPrintShell
        title="Customer Invoice Summary"
        subtitle={
          customer
            ? `${customer.customerName} (${customer.customerNumber})`
            : filters.customerNumber
        }
        meta={
          [
            filters.startDate && {
              label: 'From',
              value: filters.startDate,
            },
            filters.endDate && {
              label: 'To',
              value: filters.endDate,
            },
          ].filter(Boolean) as { label: string; value: string }[]
        }>
        <ReportPrintStats
          items={[
            { label: 'Invoices', value: data.stats.invoiceCount },
            {
              label: 'Invoiced',
              value: formatCurrency(data.stats.totalInvoiced),
            },
            {
              label: 'Paid',
              value: formatCurrency(data.stats.totalPaid),
            },
            {
              label: 'Balance Due',
              value: formatCurrency(data.stats.balanceDue),
            },
          ]}
        />

        <h2 className="mt-2 mb-1 text-sm font-semibold">Invoices</h2>
        <CustomerInvoiceList
          invoices={data.invoices.rows}
          linkable={false}
          visibleColumns={invoiceCols}
        />
      </ReportPrintShell>
    );
  }

  const data = await getInvoiceSummaryAllCustomers({
    ...filters,
    page: 1,
    pageSize: 10_000,
  });

  return (
    <ReportPrintShell
      title="Customer Invoice Summary — All Customers"
      subtitle={`${data.stats.customerCount.toLocaleString()} customers · ${data.stats.invoiceCount.toLocaleString()} invoices`}
      meta={
        [
          filters.startDate && {
            label: 'From',
            value: filters.startDate,
          },
          filters.endDate && { label: 'To', value: filters.endDate },
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
          { label: 'Invoices', value: data.stats.invoiceCount },
          {
            label: 'Invoiced',
            value: formatCurrency(data.stats.totalInvoiced),
          },
          {
            label: 'Paid',
            value: formatCurrency(data.stats.totalPaid),
          },
          {
            label: 'Balance',
            value: formatCurrency(data.stats.balanceDue),
          },
        ]}
      />
      <InvoiceSummaryAllTable
        rows={data.rows}
        linkCustomers={false}
        visibleColumns={allCustomersCols}
      />
    </ReportPrintShell>
  );
}
