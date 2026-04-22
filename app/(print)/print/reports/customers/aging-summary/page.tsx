import {
  ReportPrintShell,
  ReportPrintStats,
} from '@/features/reports/components/report-print-shell';
import { parseVisibleColumns } from '@/features/reports/components/report-columns';
import { getAgingSummary } from '@/features/reports/customers/queries';
import { agingSummaryFiltersSchema } from '@/features/reports/customers/validation';
import {
  AGING_SUMMARY_COLUMNS,
  AgingSummaryTable,
} from '@/features/reports/customers/components/aging-summary-table';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function AgingSummaryPrintPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const filters = agingSummaryFiltersSchema.parse(raw);
  const visibleColumns = parseVisibleColumns(raw.cols, AGING_SUMMARY_COLUMNS);
  const data = await getAgingSummary({
    ...filters,
    page: 1,
    pageSize: 10_000,
  });

  return (
    <ReportPrintShell
      title="Customer Sales & Aging Summary"
      subtitle={`As of ${formatDate(data.asOfDate)} · ${data.stats.pastDueCustomers.toLocaleString()} past due customers`}
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
          {
            label: 'Total AR',
            value: formatCurrency(data.stats.totalAR),
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
            label: 'MTD',
            value: formatCurrency(data.stats.mtd),
          },
          {
            label: 'YTD',
            value: formatCurrency(data.stats.ytd),
          },
          {
            label: 'L12M',
            value: formatCurrency(data.stats.l12m),
          },
        ]}
      />
      <AgingSummaryTable
        rows={data.rows}
        linkCustomers={false}
        visibleColumns={visibleColumns}
      />
    </ReportPrintShell>
  );
}
