import { Suspense } from 'react';
import { INVOICE_STATUSES } from '@/features/invoices/constants';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import { ReportPageShell } from '@/features/reports/components/report-page-shell';
import { ReportStats } from '@/features/reports/components/report-stats';
import { ReportPrintButton } from '@/features/reports/components/report-print-button';
import { ReportSelectFilter } from '@/features/reports/components/report-select-filter';
import { ReportDateInput } from '@/features/reports/components/report-date-input';
import { ReportViewTabs } from '@/features/reports/components/report-view-tabs';
import { ReportCustomerPicker } from '@/features/reports/components/report-customer-picker';
import { ReportColumnsFilter } from '@/features/reports/components/report-columns-filter';
import { parseVisibleColumns } from '@/features/reports/components/report-columns';
import {
  getActiveSalespersons,
  getDistinctTerritories,
  getInvoiceSummaryAllCustomers,
  getInvoiceSummaryPerCustomer,
} from '@/features/reports/customers/queries';
import { customerInvoicesFiltersSchema } from '@/features/reports/customers/validation';
import {
  CUSTOMER_INVOICES_COLUMNS,
  CustomerInvoiceList,
} from '@/features/reports/customers/components/customer-invoice-tables';
import {
  INVOICE_SUMMARY_ALL_COLUMNS,
  InvoiceSummaryAllTable,
} from '@/features/reports/customers/components/invoice-summary-all-table';
import { formatCurrency } from '@/lib/utils';
import { findCustomerByNumber } from '@/features/customers/queries';

const INVOICE_STATUS_OPTIONS = INVOICE_STATUSES.map((s) => ({
  label: s
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' '),
  value: s,
}));

export default async function CustomerInvoicesReportPage({
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

  const [salespersons, territories] = await Promise.all([
    getActiveSalespersons(),
    getDistinctTerritories(),
  ]);

  const salespersonOptions = salespersons.map((s) => ({
    label: `${s.firstName} ${s.lastName}`,
    value: s.employeeId,
  }));
  const territoryOptions = territories.map((t) => ({ label: t, value: t }));

  const initialCustomer =
    filters.view === 'per-customer' && filters.customerNumber
      ? await findCustomerByNumber(filters.customerNumber)
      : null;

  return (
    <ReportPageShell
      title="Customer Invoice Summary"
      description="Invoices and payment history across one or all customers.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportViewTabs
          options={[
            { label: 'All Customers', value: 'all' },
            { label: 'Per Customer', value: 'per-customer' },
          ]}
          defaultValue="all"
        />
      </div>

      {filters.view === 'per-customer' ? (
        <PerCustomerView
          filters={filters}
          initialCustomerName={initialCustomer?.customerName}
          invoiceCols={invoiceCols}
        />
      ) : (
        <AllCustomersView
          filters={filters}
          salespersonOptions={salespersonOptions}
          territoryOptions={territoryOptions}
          visibleColumns={allCustomersCols}
        />
      )}
    </ReportPageShell>
  );
}

async function PerCustomerView({
  filters,
  initialCustomerName,
  invoiceCols,
}: {
  filters: ReturnType<typeof customerInvoicesFiltersSchema.parse>;
  initialCustomerName?: string;
  invoiceCols?: Set<string>;
}) {
  const customerNumber = filters.customerNumber;

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={null}>
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportCustomerPicker
            initialCustomerNumber={customerNumber}
            initialCustomerName={initialCustomerName}
            className="lg:col-span-2"
          />
          <ReportDateInput paramName="startDate" label="From" />
          <ReportDateInput paramName="endDate" label="To" />
        </div>
      </Suspense>

      {!customerNumber ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Pick a customer above to see their invoice &amp; payment history.
        </div>
      ) : (
        <PerCustomerResults
          customerNumber={customerNumber}
          filters={filters}
          invoiceCols={invoiceCols}
        />
      )}
    </div>
  );
}

async function PerCustomerResults({
  customerNumber,
  filters,
  invoiceCols,
}: {
  customerNumber: string;
  filters: ReturnType<typeof customerInvoicesFiltersSchema.parse>;
  invoiceCols?: Set<string>;
}) {
  const data = await getInvoiceSummaryPerCustomer({
    ...filters,
    customerNumber,
  });

  if (!data.customer) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
        Customer not found.
      </div>
    );
  }

  return (
    <>
      <ReportStats
        items={[
          {
            label: 'Invoices',
            value: data.stats.invoiceCount,
            hint: `${data.stats.openCount} open`,
          },
          {
            label: 'Total Invoiced',
            value: formatCurrency(data.stats.totalInvoiced),
          },
          {
            label: 'Total Paid',
            value: formatCurrency(data.stats.totalPaid),
          },
          {
            label: 'Balance Due',
            value: formatCurrency(data.stats.balanceDue),
          },
        ]}
      />

      <section className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            Invoices — {data.customer.customerName}{' '}
            <span className="text-muted-foreground font-normal">
              ({data.customer.customerNumber})
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <ReportColumnsFilter
              columns={CUSTOMER_INVOICES_COLUMNS}
              paramName="invCols"
              label="Invoice cols"
            />
            <ReportPrintButton path="/reports/customers/customer-invoices" />
          </div>
        </div>
        <DataTablePagination
          currentPage={data.invoices.page}
          totalPages={data.invoices.totalPages}
          totalCount={data.invoices.totalCount}
          pageSize={data.invoices.pageSize}
          label="invoices"
          paramName="invPage"
        />
        <CustomerInvoiceList
          invoices={data.invoices.rows}
          visibleColumns={invoiceCols}
        />
      </section>
    </>
  );
}

async function AllCustomersView({
  filters,
  salespersonOptions,
  territoryOptions,
  visibleColumns,
}: {
  filters: ReturnType<typeof customerInvoicesFiltersSchema.parse>;
  salespersonOptions: { label: string; value: string }[];
  territoryOptions: { label: string; value: string }[];
  visibleColumns?: Set<string>;
}) {
  const data = await getInvoiceSummaryAllCustomers(filters);

  return (
    <>
      <ReportStats
        items={[
          { label: 'Customers', value: data.stats.customerCount },
          { label: 'Invoices', value: data.stats.invoiceCount },
          {
            label: 'Total Invoiced',
            value: formatCurrency(data.stats.totalInvoiced),
          },
          {
            label: 'Total Paid',
            value: formatCurrency(data.stats.totalPaid),
          },
          {
            label: 'Balance Due',
            value: formatCurrency(data.stats.balanceDue),
          },
        ]}
        className="lg:grid-cols-5"
      />
      <Suspense fallback={null}>
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ReportSelectFilter
            paramName="salesperson"
            label="Salesperson"
            options={salespersonOptions}
            allLabel="All Salespeople"
          />
          <ReportSelectFilter
            paramName="territory"
            label="Territory"
            options={territoryOptions}
            allLabel="All Territories"
          />
          <ReportSelectFilter
            paramName="status"
            label="Status"
            options={[
              ...INVOICE_STATUS_OPTIONS,
              { label: 'All', value: 'all' },
            ]}
            defaultValue="all"
            includeAll={false}
          />
          <ReportDateInput paramName="startDate" label="From" />
          <ReportDateInput paramName="endDate" label="To" />
        </div>
      </Suspense>

      <div className="flex items-center justify-end gap-2">
        <ReportColumnsFilter
          columns={INVOICE_SUMMARY_ALL_COLUMNS}
          paramName="allCols"
        />
        <ReportPrintButton path="/reports/customers/customer-invoices" />
      </div>

      <div className="rounded-lg border">
        <DataTablePagination
          currentPage={data.page}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          pageSize={data.pageSize}
          label="customers"
        />
        <InvoiceSummaryAllTable
          rows={data.rows}
          visibleColumns={visibleColumns}
        />
      </div>
    </>
  );
}
