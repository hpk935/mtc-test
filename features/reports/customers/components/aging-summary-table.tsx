import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import {
  countVisible,
  isColumnVisible,
  type ReportColumn,
} from '@/features/reports/components/report-columns';
import type { AgingSummaryRow } from '@/features/reports/customers/queries';

export const AGING_SUMMARY_COLUMNS: ReportColumn[] = [
  { key: 'customer', label: 'Customer', required: true },
  { key: 'territory', label: 'Territory' },
  { key: 'salesperson', label: 'Salesperson' },
  { key: 'current', label: 'Current' },
  { key: 'd1_30', label: '1–30' },
  { key: 'd31_60', label: '31–60' },
  { key: 'd61_90', label: '61–90' },
  { key: 'd90_plus', label: '90+' },
  { key: 'balanceDue', label: 'Balance Due' },
  { key: 'mtd', label: 'MTD' },
  { key: 'ytd', label: 'YTD' },
  { key: 'l12m', label: 'L12M' },
];

function sum(rows: AgingSummaryRow[], key: keyof AgingSummaryRow): number {
  return rows.reduce((acc, r) => acc + Number(r[key] ?? 0), 0);
}

export function AgingSummaryTable({
  rows,
  linkCustomers = true,
  visibleColumns,
}: {
  rows: AgingSummaryRow[];
  linkCustomers?: boolean;
  visibleColumns?: Set<string>;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No customers match the selected filters.
      </div>
    );
  }

  const show = (key: string) => isColumnVisible(visibleColumns, key);
  const leadingSpan = countVisible(visibleColumns, [
    'customer',
    'territory',
    'salesperson',
  ]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {show('customer') && <TableHead>Customer</TableHead>}
          {show('territory') && <TableHead>Territory</TableHead>}
          {show('salesperson') && <TableHead>Salesperson</TableHead>}
          {show('current') && (
            <TableHead className="text-right">Current</TableHead>
          )}
          {show('d1_30') && <TableHead className="text-right">1–30</TableHead>}
          {show('d31_60') && (
            <TableHead className="text-right">31–60</TableHead>
          )}
          {show('d61_90') && (
            <TableHead className="text-right">61–90</TableHead>
          )}
          {show('d90_plus') && (
            <TableHead className="text-right">90+</TableHead>
          )}
          {show('balanceDue') && (
            <TableHead className="text-right">Balance Due</TableHead>
          )}
          {show('mtd') && <TableHead className="text-right">MTD</TableHead>}
          {show('ytd') && <TableHead className="text-right">YTD</TableHead>}
          {show('l12m') && <TableHead className="text-right">L12M</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.customerNumber}>
            {show('customer') && (
              <TableCell className="font-medium">
                {linkCustomers ? (
                  <a
                    href={`/reports/customers/customer-invoices?view=per-customer&customerNumber=${encodeURIComponent(r.customerNumber)}`}
                    className="hover:underline">
                    {r.customerName}
                  </a>
                ) : (
                  r.customerName
                )}
                <span className="text-muted-foreground block text-xs">
                  {r.customerNumber}
                </span>
              </TableCell>
            )}
            {show('territory') && <TableCell>{r.territoryCode}</TableCell>}
            {show('salesperson') && <TableCell>{r.salespersonCode}</TableCell>}
            {show('current') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.current))}
              </TableCell>
            )}
            {show('d1_30') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.d1_30))}
              </TableCell>
            )}
            {show('d31_60') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.d31_60))}
              </TableCell>
            )}
            {show('d61_90') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.d61_90))}
              </TableCell>
            )}
            {show('d90_plus') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.d90_plus))}
              </TableCell>
            )}
            {show('balanceDue') && (
              <TableCell className="text-right font-semibold tabular-nums">
                {formatCurrency(Number(r.balanceDue))}
              </TableCell>
            )}
            {show('mtd') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.mtd))}
              </TableCell>
            )}
            {show('ytd') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.ytd))}
              </TableCell>
            )}
            {show('l12m') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.l12m))}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={leadingSpan} className="font-semibold">
            Page totals
          </TableCell>
          {show('current') && (
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(sum(rows, 'current'))}
            </TableCell>
          )}
          {show('d1_30') && (
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(sum(rows, 'd1_30'))}
            </TableCell>
          )}
          {show('d31_60') && (
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(sum(rows, 'd31_60'))}
            </TableCell>
          )}
          {show('d61_90') && (
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(sum(rows, 'd61_90'))}
            </TableCell>
          )}
          {show('d90_plus') && (
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(sum(rows, 'd90_plus'))}
            </TableCell>
          )}
          {show('balanceDue') && (
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(sum(rows, 'balanceDue'))}
            </TableCell>
          )}
          {show('mtd') && (
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(sum(rows, 'mtd'))}
            </TableCell>
          )}
          {show('ytd') && (
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(sum(rows, 'ytd'))}
            </TableCell>
          )}
          {show('l12m') && (
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(sum(rows, 'l12m'))}
            </TableCell>
          )}
        </TableRow>
      </TableFooter>
    </Table>
  );
}
