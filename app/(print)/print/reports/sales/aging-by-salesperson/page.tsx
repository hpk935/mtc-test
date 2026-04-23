import {
  ReportPrintShell,
  ReportPrintStats,
} from '@/features/reports/components/report-print-shell';
import { parseVisibleColumns } from '@/features/reports/components/report-columns';
import { getAgingBySalesperson } from '@/features/reports/sales/queries';
import { agingBySalespersonFiltersSchema } from '@/features/reports/sales/validation';
import {
  AGING_BY_SALESPERSON_COLUMNS,
  AgingBySalespersonTable,
} from '@/features/reports/sales/components/aging-by-salesperson-table';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function AgingBySalespersonPrintPage({
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
  const data = await getAgingBySalesperson({
    ...filters,
    page: 1,
    pageSize: 10_000,
  });

  return (
    <ReportPrintShell
      title="Aging Report by Salesperson"
      subtitle={`As of ${formatDate(data.asOfDate)}`}
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
          { label: 'Total AR', value: formatCurrency(data.stats.totalAR) },
          { label: 'Current', value: formatCurrency(data.stats.current) },
          { label: 'Past Due', value: formatCurrency(data.stats.pastDue) },
          { label: 'MTD', value: formatCurrency(data.stats.mtd) },
          { label: 'YTD', value: formatCurrency(data.stats.ytd) },
          { label: 'L12M', value: formatCurrency(data.stats.l12m) },
        ]}
      />
      <AgingBySalespersonTable
        rows={data.rows}
        linkSalespeople={false}
        visibleColumns={visibleColumns}
      />
    </ReportPrintShell>
  );
}
