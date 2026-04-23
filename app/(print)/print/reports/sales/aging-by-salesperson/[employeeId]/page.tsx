import { notFound } from 'next/navigation';
import {
  ReportPrintShell,
  ReportPrintStats,
} from '@/features/reports/components/report-print-shell';
import {
  findSalespersonByEmployeeId,
  getSalespersonAgingDetail,
} from '@/features/reports/sales/queries';
import { agingBySalespersonFiltersSchema } from '@/features/reports/sales/validation';
import { SalespersonAgingDetailTable } from '@/features/reports/sales/components/salesperson-aging-detail-table';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function SalespersonAgingDetailPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { employeeId } = await params;
  const raw = await searchParams;
  const filters = agingBySalespersonFiltersSchema.parse(raw);

  const salesperson = await findSalespersonByEmployeeId(employeeId);
  if (!salesperson) notFound();

  const data = await getSalespersonAgingDetail({ employeeId, ...filters });
  const repName = `${salesperson.firstName} ${salesperson.lastName}`;

  return (
    <ReportPrintShell
      title={`Aging Detail · ${repName}`}
      subtitle={`${salesperson.employeeId} · As of ${formatDate(data.asOfDate)}`}
      meta={
        [
          filters.territory && {
            label: 'Territory',
            value: filters.territory,
          },
        ].filter(Boolean) as { label: string; value: string }[]
      }>
      <ReportPrintStats
        items={[
          { label: 'Balance', value: formatCurrency(data.totals.balanceDue) },
          { label: 'Current', value: formatCurrency(data.totals.current) },
          { label: 'Past Due', value: formatCurrency(data.totals.pastDue) },
          { label: 'MTD', value: formatCurrency(data.totals.mtd) },
          { label: 'YTD', value: formatCurrency(data.totals.ytd) },
          { label: 'L12M', value: formatCurrency(data.totals.l12m) },
        ]}
      />
      <SalespersonAgingDetailTable groups={data.groups} linkInvoices={false} />
    </ReportPrintShell>
  );
}
