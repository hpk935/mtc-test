import { Suspense } from 'react';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import { ReportPageShell } from '@/features/reports/components/report-page-shell';
import { ReportStats } from '@/features/reports/components/report-stats';
import { ReportPrintButton } from '@/features/reports/components/report-print-button';
import { ReportSelectFilter } from '@/features/reports/components/report-select-filter';
import { ReportDateInput } from '@/features/reports/components/report-date-input';
import { ReportCustomerPicker } from '@/features/reports/components/report-customer-picker';
import { ReportColumnsFilter } from '@/features/reports/components/report-columns-filter';
import { parseVisibleColumns } from '@/features/reports/components/report-columns';
import {
  getActiveSalespersons,
  getAgingSummary,
} from '@/features/reports/customers/queries';
import { agingSummaryFiltersSchema } from '@/features/reports/customers/validation';
import {
  AGING_SUMMARY_COLUMNS,
  AgingSummaryTable,
} from '@/features/reports/customers/components/aging-summary-table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { findCustomerByNumber } from '@/features/customers/queries';
import { getAllTerritoryCodes } from '@/features/reference-codes/queries';

export default async function AgingSummaryReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const filters = agingSummaryFiltersSchema.parse(raw);
  const visibleColumns = parseVisibleColumns(raw.cols, AGING_SUMMARY_COLUMNS);

  const [data, salespersons, territories, initialCustomer] = await Promise.all([
    getAgingSummary(filters),
    getActiveSalespersons(),
    getAllTerritoryCodes(),
    filters.customerNumber
      ? findCustomerByNumber(filters.customerNumber)
      : Promise.resolve(null),
  ]);

  const salespersonOptions = salespersons.map((s) => ({
    label: `${s.firstName} ${s.lastName}`,
    value: s.employeeId,
  }));
  const territoryOptions = territories.map((t) => ({ label: t, value: t }));

  return (
    <ReportPageShell
      title="Customer Sales & Aging Summary"
      description="Accounts receivable aging and sales totals per customer. Aging is based on due date (or invoice date if no due date).">
      <ReportStats
        items={[
          {
            label: 'Total AR',
            value: formatCurrency(data.stats.totalAR),
            hint: `As of ${formatDate(data.asOfDate)}`,
          },
          {
            label: 'Current',
            value: formatCurrency(data.stats.current),
          },
          {
            label: 'Past Due',
            value: formatCurrency(data.stats.pastDue),
            hint: `${data.stats.pastDueCustomers} customers`,
          },
          {
            label: 'MTD Sales',
            value: formatCurrency(data.stats.mtd),
          },
          {
            label: 'YTD Sales',
            value: formatCurrency(data.stats.ytd),
          },
          {
            label: 'L12M Sales',
            value: formatCurrency(data.stats.l12m),
          },
        ]}
        className="xl:grid-cols-6"
      />

      <Suspense fallback={null}>
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportCustomerPicker
            initialCustomerNumber={filters.customerNumber}
            initialCustomerName={initialCustomer?.customerName}
            className="lg:col-span-2"
          />
          <ReportDateInput paramName="asOf" label="As of date" />
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

      <div className="flex items-center justify-end gap-2">
        <ReportColumnsFilter columns={AGING_SUMMARY_COLUMNS} />
        <ReportPrintButton path="/reports/customers/aging-summary" />
      </div>

      <div className="rounded-lg border">
        <DataTablePagination
          currentPage={data.page}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          pageSize={data.pageSize}
          label="customers"
        />
        <AgingSummaryTable rows={data.rows} visibleColumns={visibleColumns} />
      </div>
    </ReportPageShell>
  );
}
