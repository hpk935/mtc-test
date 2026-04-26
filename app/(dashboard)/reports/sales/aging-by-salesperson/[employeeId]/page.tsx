import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ReportPageShell } from '@/features/reports/components/report-page-shell';
import { ReportStats } from '@/features/reports/components/report-stats';
import { ReportPrintButton } from '@/features/reports/components/report-print-button';
import { ReportSelectFilter } from '@/features/reports/components/report-select-filter';
import {
  findSalespersonByEmployeeId,
  getInvoiceTerritories,
  getSalespersonAgingDetail,
} from '@/features/reports/sales/queries';
import { agingBySalespersonFiltersSchema } from '@/features/reports/sales/validation';
import { SalespersonAgingDetailTable } from '@/features/reports/sales/components/salesperson-aging-detail-table';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function SalespersonAgingDetailPage({
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

  const [data, territories] = await Promise.all([
    getSalespersonAgingDetail({ employeeId, ...filters }),
    getInvoiceTerritories(),
  ]);
  const territoryOptions = territories.map((t) => ({ label: t, value: t }));

  const repName = `${salesperson.firstName} ${salesperson.lastName}`;

  return (
    <ReportPageShell
      title={`${repName} · Aging Detail`}
      description={`Open invoices assigned to ${salesperson.employeeId}${salesperson.isActive ? '' : ' (inactive)'}. Aging based on due date (or invoice date if no due date).`}
      backHref="/reports/sales/aging-by-salesperson">
      <ReportStats
        items={[
          {
            label: 'Balance Due',
            value: formatCurrency(data.totals.balanceDue),
            hint: `As of ${formatDate(data.asOfDate)}`,
          },
          {
            label: 'Current',
            value: formatCurrency(data.totals.current),
          },
          {
            label: 'Past Due',
            value: formatCurrency(data.totals.pastDue),
            hint: `${data.totals.invoiceCount} open · ${data.totals.customerCount} customers`,
          },
          {
            label: 'MTD Sales',
            value: formatCurrency(data.totals.mtd),
          },
          {
            label: 'YTD Sales',
            value: formatCurrency(data.totals.ytd),
          },
          {
            label: 'L12M Sales',
            value: formatCurrency(data.totals.l12m),
            hint: `${data.totals.l12mInvoiceCount} invoices`,
          },
        ]}
        className="xl:grid-cols-6"
      />

      <Suspense fallback={null}>
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportSelectFilter
            paramName="territory"
            label="Territory"
            options={territoryOptions}
            allLabel="All Territories"
          />
        </div>
      </Suspense>

      <div className="flex items-center justify-end gap-2">
        <ReportPrintButton
          path={`/reports/sales/aging-by-salesperson/${employeeId}`}
        />
      </div>

      <div className="rounded-lg border">
        <SalespersonAgingDetailTable groups={data.groups} />
      </div>
    </ReportPageShell>
  );
}
