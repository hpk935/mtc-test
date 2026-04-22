import type { AccountStatus } from '@/features/customers/constants';
import {
  ReportPrintShell,
  ReportPrintStats,
} from '@/features/reports/components/report-print-shell';
import { parseVisibleColumns } from '@/features/reports/components/report-columns';
import {
  CUSTOMER_LISTING_COLUMNS,
  CustomerListingTable,
} from '@/features/reports/customers/components/customer-listing-table';
import { getCustomerListingReport } from '@/features/reports/customers/queries';
import { customerListingFiltersSchema } from '@/features/reports/customers/validation';

export default async function CustomerListingPrintPage({
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
  const report = await getCustomerListingReport({
    search: filters.search,
    salesperson: filters.salesperson,
    territory: filters.territory,
    status: filters.status as AccountStatus | 'all',
    page: 1,
    pageSize: 10_000,
  });

  const metaBits: { label: string; value: string }[] = [];
  if (filters.status) metaBits.push({ label: 'Status', value: filters.status });
  if (filters.salesperson)
    metaBits.push({ label: 'Salesperson', value: filters.salesperson });
  if (filters.territory)
    metaBits.push({ label: 'Territory', value: filters.territory });
  if (filters.search) metaBits.push({ label: 'Search', value: filters.search });

  return (
    <ReportPrintShell
      title="Customer Name Listing"
      subtitle={`${report.stats.total.toLocaleString()} customers`}
      meta={metaBits}>
      <ReportPrintStats
        items={[
          { label: 'Total', value: report.stats.total },
          { label: 'Active', value: report.stats.active },
          { label: 'Inactive', value: report.stats.inactive },
          { label: 'On Hold', value: report.stats.onHold },
          { label: 'Territories', value: report.stats.territories },
          { label: 'New (90d)', value: report.stats.newLast90 },
        ]}
      />
      <CustomerListingTable
        rows={report.rows}
        linkCustomers={false}
        visibleColumns={visibleColumns}
      />
    </ReportPrintShell>
  );
}
