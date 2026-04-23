import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  countVisible,
  isColumnVisible,
  type ReportColumn,
} from '@/features/reports/components/report-columns';
import type { ItemInvoiceHistoryRow } from '@/features/reports/products/queries';

export const ITEM_INVOICE_HISTORY_COLUMNS: ReportColumn[] = [
  { key: 'invoice', label: 'Invoice', required: true },
  { key: 'date', label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'territory', label: 'Territory' },
  { key: 'salesperson', label: 'Salesperson' },
  { key: 'qtyOrdered', label: 'Qty Ordered' },
  { key: 'qtyShipped', label: 'Qty Shipped' },
  { key: 'unitPrice', label: 'Unit Price' },
  { key: 'discount', label: 'Discount' },
  { key: 'lineTotal', label: 'Line Total' },
  { key: 'status', label: 'Status' },
];

const STATUS_VARIANT: Record<
  string,
  'success' | 'secondary' | 'warning' | 'destructive'
> = {
  paid: 'success',
  open: 'secondary',
  partially_paid: 'warning',
  voided: 'destructive',
};

const STATUS_LABEL: Record<string, string> = {
  paid: 'Paid',
  open: 'Open',
  partially_paid: 'Partial',
  voided: 'Voided',
};

function sumNumber(
  rows: ItemInvoiceHistoryRow[],
  key: keyof ItemInvoiceHistoryRow,
): number {
  return rows.reduce((acc, r) => acc + Number(r[key] ?? 0), 0);
}

export function ItemInvoiceHistoryTable({
  rows,
  linkInvoices = true,
  visibleColumns,
}: {
  rows: ItemInvoiceHistoryRow[];
  linkInvoices?: boolean;
  visibleColumns?: Set<string>;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No invoices found for this item in the selected period.
      </div>
    );
  }

  const show = (key: string) => isColumnVisible(visibleColumns, key);
  const leadingSpan = countVisible(visibleColumns, [
    'invoice',
    'date',
    'customer',
    'territory',
    'salesperson',
  ]);
  const trailingSpan = countVisible(visibleColumns, ['status']);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {show('invoice') && <TableHead>Invoice</TableHead>}
          {show('date') && <TableHead>Date</TableHead>}
          {show('customer') && <TableHead>Customer</TableHead>}
          {show('territory') && <TableHead>Territory</TableHead>}
          {show('salesperson') && <TableHead>Salesperson</TableHead>}
          {show('qtyOrdered') && (
            <TableHead className="text-right">Qty Ordered</TableHead>
          )}
          {show('qtyShipped') && (
            <TableHead className="text-right">Qty Shipped</TableHead>
          )}
          {show('unitPrice') && (
            <TableHead className="text-right">Unit Price</TableHead>
          )}
          {show('discount') && (
            <TableHead className="text-right">Discount</TableHead>
          )}
          {show('lineTotal') && (
            <TableHead className="text-right">Line Total</TableHead>
          )}
          {show('status') && <TableHead>Status</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.invoiceNumber} className="group">
            {show('invoice') && (
              <TableCell className="font-medium">
                {linkInvoices ? (
                  <Link
                    href={`/invoices/${r.invoiceNumber}`}
                    className="group-hover:underline">
                    {r.invoiceNumber}
                  </Link>
                ) : (
                  r.invoiceNumber
                )}
                <span className="text-muted-foreground block text-xs">
                  Order {r.orderNumber}
                </span>
              </TableCell>
            )}
            {show('date') && <TableCell>{formatDate(r.invoiceDate)}</TableCell>}
            {show('customer') && (
              <TableCell>
                <Link
                  href={`/customers/${r.customerNumber}`}
                  className="hover:underline">
                  {r.customerName}
                </Link>
                <span className="text-muted-foreground block text-xs">
                  {r.customerNumber}
                </span>
              </TableCell>
            )}
            {show('territory') && <TableCell>{r.territoryCode}</TableCell>}
            {show('salesperson') && <TableCell>{r.salespersonCode}</TableCell>}
            {show('qtyOrdered') && (
              <TableCell className="text-right tabular-nums">
                {r.qtyOrdered.toLocaleString()}
              </TableCell>
            )}
            {show('qtyShipped') && (
              <TableCell className="text-right font-semibold tabular-nums">
                {r.qtyShipped.toLocaleString()}
              </TableCell>
            )}
            {show('unitPrice') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.unitPrice))}
              </TableCell>
            )}
            {show('discount') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.discount))}
              </TableCell>
            )}
            {show('lineTotal') && (
              <TableCell className="text-right font-semibold tabular-nums">
                {formatCurrency(Number(r.lineTotal))}
              </TableCell>
            )}
            {show('status') && (
              <TableCell>
                <Badge variant={STATUS_VARIANT[r.invoiceStatus] ?? 'secondary'}>
                  {STATUS_LABEL[r.invoiceStatus] ?? r.invoiceStatus}
                </Badge>
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
          {show('qtyOrdered') && (
            <TableCell className="text-right font-semibold tabular-nums">
              {sumNumber(rows, 'qtyOrdered').toLocaleString()}
            </TableCell>
          )}
          {show('qtyShipped') && (
            <TableCell className="text-right font-semibold tabular-nums">
              {sumNumber(rows, 'qtyShipped').toLocaleString()}
            </TableCell>
          )}
          {show('unitPrice') && <TableCell />}
          {show('discount') && (
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(sumNumber(rows, 'discount'))}
            </TableCell>
          )}
          {show('lineTotal') && (
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(sumNumber(rows, 'lineTotal'))}
            </TableCell>
          )}
          {trailingSpan > 0 && <TableCell />}
        </TableRow>
      </TableFooter>
    </Table>
  );
}
