import { Suspense } from 'react';
import {
  ACCOUNT_STATUSES,
  type AccountStatus,
} from '@/features/customers/constants';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import { DataTableSearch } from '@/components/data/data-table-search';
import { ReportPageShell } from '@/features/reports/components/report-page-shell';
import { ReportStats } from '@/features/reports/components/report-stats';
import { ReportPrintButton } from '@/features/reports/components/report-print-button';
import { ReportSelectFilter } from '@/features/reports/components/report-select-filter';
import { ReportColumnsFilter } from '@/features/reports/components/report-columns-filter';
import { parseVisibleColumns } from '@/features/reports/components/report-columns';
import {
  getActiveSalespersons,
  getCustomerListingReport,
  getDistinctTerritories,
} from '@/features/reports/customers/queries';
import { customerListingFiltersSchema } from '@/features/reports/customers/validation';
import {
  CUSTOMER_LISTING_COLUMNS,
  CustomerListingTable,
} from '@/features/reports/customers/components/customer-listing-table';

const STATUS_OPTIONS = [
  ...ACCOUNT_STATUSES.map((s) => ({
    label: s === 'on_hold' ? 'On Hold' : s.charAt(0).toUpperCase() + s.slice(1),
    value: s,
  })),
];

export default async function CustomerListingReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const filters = customerListingFiltersSchema.parse(raw);
  const visibleColumns = parseVisibleColumns(
    raw.cols,
    CUSTOMER_LISTING_COLUMNS,
  );

  const [report, salespersons, territories] = await Promise.all([
    getCustomerListingReport({
      search: filters.search,
      salesperson: filters.salesperson,
      territory: filters.territory,
      status: filters.status as AccountStatus | 'all',
      page: filters.page,
    }),
    getActiveSalespersons(),
    getDistinctTerritories(),
  ]);

  const salespersonOptions = salespersons.map((s) => ({
    label: `${s.firstName} ${s.lastName}`,
    value: s.employeeId,
  }));
  const territoryOptions = territories.map((t) => ({ label: t, value: t }));

  return (
    <ReportPageShell
      title="Customer Name Listing"
      description="Customers filterable by salesperson, territory, and status.">
      <ReportStats
        items={[
          { label: 'Total (matching)', value: report.stats.total },
          { label: 'Active', value: report.stats.active },
          { label: 'Inactive', value: report.stats.inactive },
          { label: 'On Hold', value: report.stats.onHold },
          {
            label: 'Territories',
            value: report.stats.territories,
          },
          {
            label: 'New (last 90d)',
            value: report.stats.newLast90,
          },
        ]}
        className="lg:grid-cols-6"
      />

      <Suspense fallback={null}>
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <label className="text-muted-foreground mb-1 block text-xs font-medium">
              Search
            </label>
            <DataTableSearch placeholder="Name, #, contact, email..." />
          </div>
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
            options={[...STATUS_OPTIONS, { label: 'All', value: 'all' }]}
            defaultValue="active"
            includeAll={false}
          />
        </div>
      </Suspense>

      <div className="flex items-center justify-end gap-2">
        <ReportColumnsFilter columns={CUSTOMER_LISTING_COLUMNS} />
        <ReportPrintButton path="/reports/customers/customer-listing" />
      </div>

      <div className="rounded-lg border">
        <DataTablePagination
          currentPage={report.page}
          totalPages={report.totalPages}
          totalCount={report.totalCount}
          pageSize={report.pageSize}
          label="customers"
        />
        <CustomerListingTable
          rows={report.rows}
          visibleColumns={visibleColumns}
        />
      </div>
    </ReportPageShell>
  );
}
