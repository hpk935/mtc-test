import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  isColumnVisible,
  type ReportColumn,
} from '@/features/reports/components/report-columns';
import type { InvoiceSummaryAllRow } from '@/features/reports/customers/queries';

export const INVOICE_SUMMARY_ALL_COLUMNS: ReportColumn[] = [
  { key: 'customer', label: 'Customer', required: true },
  { key: 'territory', label: 'Territory' },
  { key: 'salesperson', label: 'Salesperson' },
  { key: 'invoiceCount', label: 'Invoices' },
  { key: 'invoiced', label: 'Invoiced' },
  { key: 'paid', label: 'Paid' },
  { key: 'balance', label: 'Balance Due' },
  { key: 'lastInvoice', label: 'Last Invoice' },
];

export function InvoiceSummaryAllTable({
  rows,
  linkCustomers = true,
  visibleColumns,
}: {
  rows: InvoiceSummaryAllRow[];
  linkCustomers?: boolean;
  visibleColumns?: Set<string>;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No invoices match the selected filters.
      </div>
    );
  }

  const show = (key: string) => isColumnVisible(visibleColumns, key);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {show('customer') && <TableHead>Customer</TableHead>}
          {show('territory') && <TableHead>Territory</TableHead>}
          {show('salesperson') && <TableHead>Salesperson</TableHead>}
          {show('invoiceCount') && (
            <TableHead className="text-right">Invoices</TableHead>
          )}
          {show('invoiced') && (
            <TableHead className="text-right">Invoiced</TableHead>
          )}
          {show('paid') && <TableHead className="text-right">Paid</TableHead>}
          {show('balance') && (
            <TableHead className="text-right">Balance Due</TableHead>
          )}
          {show('lastInvoice') && <TableHead>Last Invoice</TableHead>}
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
            {show('invoiceCount') && (
              <TableCell className="text-right tabular-nums">
                {r.invoiceCount}
              </TableCell>
            )}
            {show('invoiced') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.totalInvoiced))}
              </TableCell>
            )}
            {show('paid') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.totalPaid))}
              </TableCell>
            )}
            {show('balance') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.balanceDue))}
              </TableCell>
            )}
            {show('lastInvoice') && (
              <TableCell>
                {r.lastInvoiceDate ? formatDate(r.lastInvoiceDate) : '—'}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
