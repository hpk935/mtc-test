import { Suspense } from 'react';
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
import { findCustomerByNumber } from '@/features/customers/queries';
import { getAllTerritoryCodes } from '@/features/reference-codes/queries';

export default async function CustomerPurchasesReportPage({
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

  const [salespersons, territories] = await Promise.all([
    getActiveSalespersons(),
    getAllTerritoryCodes(),
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
      title="Customer Purchase History"
      description="Quantity and dollars purchased (based on billed invoices) over a selectable period.">
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
          itemCols={itemCols}
        />
      ) : (
        <CrossCustomerView
          filters={filters}
          salespersonOptions={salespersonOptions}
          territoryOptions={territoryOptions}
          customerCols={customerCols}
        />
      )}
    </ReportPageShell>
  );
}

async function PerCustomerView({
  filters,
  initialCustomerName,
  itemCols,
}: {
  filters: ReturnType<typeof customerPurchasesFiltersSchema.parse>;
  initialCustomerName?: string;
  itemCols?: Set<string>;
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
          Pick a customer above to see their purchase history.
        </div>
      ) : (
        <PerCustomerResults
          customerNumber={customerNumber}
          filters={filters}
          itemCols={itemCols}
        />
      )}
    </div>
  );
}

async function PerCustomerResults({
  customerNumber,
  filters,
  itemCols,
}: {
  customerNumber: string;
  filters: ReturnType<typeof customerPurchasesFiltersSchema.parse>;
  itemCols?: Set<string>;
}) {
  const data = await getPurchaseHistoryPerCustomer({
    ...filters,
    customerNumber,
  });

  return (
    <>
      <ReportStats
        items={[
          { label: 'Orders', value: data.stats.orderCount },
          { label: 'Invoices', value: data.stats.invoiceCount },
          {
            label: 'Total Qty',
            value: data.stats.totalQty.toLocaleString(),
          },
          {
            label: 'Total Purchased',
            value: formatCurrency(data.stats.totalAmount),
          },
        ]}
      />

      <section className="rounded-lg border">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            {data.customer?.customerName ?? customerNumber}{' '}
            <span className="text-muted-foreground font-normal">
              · {formatDate(data.periodRange.startDate)} –{' '}
              {formatDate(data.periodRange.endDate)}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <ReportColumnsFilter
              columns={PURCHASE_ITEMS_COLUMNS}
              paramName="itemCols"
            />
            <ReportPrintButton path="/reports/customers/customer-purchases" />
          </div>
        </div>
        <DataTablePagination
          currentPage={data.rows.page}
          totalPages={data.rows.totalPages}
          totalCount={data.rows.totalCount}
          pageSize={data.rows.pageSize}
          label="items"
          paramName="itemPage"
        />
        <PurchaseItemsTable rows={data.rows.rows} visibleColumns={itemCols} />
      </section>
    </>
  );
}

async function CrossCustomerView({
  filters,
  salespersonOptions,
  territoryOptions,
  customerCols,
}: {
  filters: ReturnType<typeof customerPurchasesFiltersSchema.parse>;
  salespersonOptions: { label: string; value: string }[];
  territoryOptions: { label: string; value: string }[];
  customerCols?: Set<string>;
}) {
  const data = await getPurchaseHistoryAllCustomers(filters);

  return (
    <>
      <ReportStats
        items={[
          { label: 'Customers', value: data.stats.customerCount },
          { label: 'Orders', value: data.stats.orderCount },
          { label: 'Invoices', value: data.stats.invoiceCount },
          {
            label: 'Total Qty',
            value: data.stats.totalQty.toLocaleString(),
          },
          {
            label: 'Total Purchased',
            value: formatCurrency(data.stats.totalAmount),
          },
        ]}
        className="xl:grid-cols-5"
      />
      <Suspense fallback={null}>
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportDateInput paramName="startDate" label="From" />
          <ReportDateInput paramName="endDate" label="To" />
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
        </div>
      </Suspense>
      <div className="rounded-lg border">
        <div className="text-muted-foreground flex items-center justify-between border-b px-4 py-2 text-xs">
          <span>
            {formatDate(data.periodRange.startDate)} –{' '}
            {formatDate(data.periodRange.endDate)}
          </span>
          <div className="flex items-center gap-2">
            <ReportColumnsFilter
              columns={PURCHASE_CUSTOMERS_COLUMNS}
              paramName="custCols"
            />
            <ReportPrintButton path="/reports/customers/customer-purchases" />
          </div>
        </div>
        <DataTablePagination
          currentPage={data.page}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          pageSize={data.pageSize}
          label="customers"
        />
        <PurchaseCustomersTable
          rows={data.rows}
          visibleColumns={customerCols}
        />
      </div>
    </>
  );
}
