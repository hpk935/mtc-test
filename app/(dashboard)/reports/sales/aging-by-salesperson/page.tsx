import { Suspense } from 'react';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import { ReportPageShell } from '@/features/reports/components/report-page-shell';
import { ReportStats } from '@/features/reports/components/report-stats';
import { ReportPrintButton } from '@/features/reports/components/report-print-button';
import { ReportSelectFilter } from '@/features/reports/components/report-select-filter';
import { ReportColumnsFilter } from '@/features/reports/components/report-columns-filter';
import { parseVisibleColumns } from '@/features/reports/components/report-columns';
import {
  getAgingBySalesperson,
  getInvoiceTerritories,
  getSalespersonOptions,
} from '@/features/reports/sales/queries';
import { agingBySalespersonFiltersSchema } from '@/features/reports/sales/validation';
import {
  AGING_BY_SALESPERSON_COLUMNS,
  AgingBySalespersonTable,
} from '@/features/reports/sales/components/aging-by-salesperson-table';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function AgingBySalespersonReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const filters = agingBySalespersonFiltersSchema.parse(raw);
  const visibleColumns = parseVisibleColumns(
    raw.cols,
    AGING_BY_SALESPERSON_COLUMNS,
  );

  const [data, territories, salespeople] = await Promise.all([
    getAgingBySalesperson(filters),
    getInvoiceTerritories(),
    getSalespersonOptions(),
  ]);

  const territoryOptions = territories.map((t) => ({ label: t, value: t }));
  const salespersonOptions = salespeople.map((s) => ({
    label: `${s.name} (${s.employeeId})`,
    value: s.employeeId,
  }));

  return (
    <ReportPageShell
      title="Aging Report by Salesperson"
      description="Accounts receivable aging and sales totals grouped by salesperson. Aging is based on due date (or invoice date if no due date).">
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
            hint: `${data.stats.salespersonCount} active salespeople`,
          },
        ]}
        className="xl:grid-cols-6"
      />

      <Suspense fallback={null}>
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <ReportColumnsFilter columns={AGING_BY_SALESPERSON_COLUMNS} />
        <ReportPrintButton path="/reports/sales/aging-by-salesperson" />
      </div>

      <div className="rounded-lg border">
        <DataTablePagination
          currentPage={data.page}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          pageSize={data.pageSize}
          label="salespeople"
        />
        <AgingBySalespersonTable
          rows={data.rows}
          visibleColumns={visibleColumns}
        />
      </div>
    </ReportPageShell>
  );
}
