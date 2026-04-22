import { Badge } from '@/components/ui/badge';
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

export const CUSTOMER_INVOICES_COLUMNS: ReportColumn[] = [
  { key: 'invoice', label: 'Invoice #', required: true },
  { key: 'order', label: 'Order #' },
  { key: 'po', label: 'PO #' },
  { key: 'invoiceDate', label: 'Invoice Date' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'paidDate', label: 'Paid Date' },
  { key: 'total', label: 'Total' },
  { key: 'paid', label: 'Paid' },
  { key: 'balance', label: 'Balance' },
  { key: 'status', label: 'Status' },
];

export const CUSTOMER_PAYMENTS_COLUMNS: ReportColumn[] = [
  { key: 'paymentDate', label: 'Payment Date', required: true },
  { key: 'invoice', label: 'Invoice #' },
  { key: 'reference', label: 'Reference' },
  { key: 'amount', label: 'Amount' },
];

interface InvoiceRow {
  invoiceNumber: string;
  orderNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  paidDate: string | null;
  totalAmount: string;
  amountPaid: string;
  balanceDue: string;
  invoiceStatus: string;
  customerPoReference: string | null;
}

interface PaymentRow {
  id: number;
  invoiceNumber: string;
  amount: string;
  paymentDate: string;
  paymentRef: string | null;
}

const STATUS_VARIANT: Record<
  string,
  'success' | 'secondary' | 'warning' | 'destructive'
> = {
  open: 'warning',
  partially_paid: 'warning',
  paid: 'success',
  voided: 'destructive',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  partially_paid: 'Partial',
  paid: 'Paid',
  voided: 'Voided',
};

export function CustomerInvoiceList({
  invoices,
  linkable = true,
  visibleColumns,
}: {
  invoices: InvoiceRow[];
  linkable?: boolean;
  visibleColumns?: Set<string>;
}) {
  if (invoices.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-10 text-sm">
        No invoices match the selected filters.
      </div>
    );
  }

  const show = (key: string) => isColumnVisible(visibleColumns, key);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {show('invoice') && <TableHead>Invoice #</TableHead>}
          {show('order') && <TableHead>Order #</TableHead>}
          {show('po') && <TableHead>PO #</TableHead>}
          {show('invoiceDate') && <TableHead>Invoice Date</TableHead>}
          {show('dueDate') && <TableHead>Due Date</TableHead>}
          {show('paidDate') && <TableHead>Paid Date</TableHead>}
          {show('total') && <TableHead className="text-right">Total</TableHead>}
          {show('paid') && <TableHead className="text-right">Paid</TableHead>}
          {show('balance') && (
            <TableHead className="text-right">Balance</TableHead>
          )}
          {show('status') && <TableHead>Status</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => (
          <TableRow key={inv.invoiceNumber}>
            {show('invoice') && (
              <TableCell className="font-mono font-medium">
                {linkable ? (
                  <a
                    href={`/invoices/${inv.invoiceNumber}`}
                    className="hover:underline">
                    {inv.invoiceNumber}
                  </a>
                ) : (
                  inv.invoiceNumber
                )}
              </TableCell>
            )}
            {show('order') && (
              <TableCell className="font-mono text-xs">
                {inv.orderNumber}
              </TableCell>
            )}
            {show('po') && (
              <TableCell className="text-xs">
                {inv.customerPoReference ?? '—'}
              </TableCell>
            )}
            {show('invoiceDate') && (
              <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
            )}
            {show('dueDate') && (
              <TableCell>
                {inv.dueDate ? formatDate(inv.dueDate) : '—'}
              </TableCell>
            )}
            {show('paidDate') && (
              <TableCell>
                {inv.paidDate ? formatDate(inv.paidDate) : '—'}
              </TableCell>
            )}
            {show('total') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(inv.totalAmount))}
              </TableCell>
            )}
            {show('paid') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(inv.amountPaid))}
              </TableCell>
            )}
            {show('balance') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(inv.balanceDue))}
              </TableCell>
            )}
            {show('status') && (
              <TableCell>
                <Badge
                  variant={STATUS_VARIANT[inv.invoiceStatus] ?? 'secondary'}>
                  {STATUS_LABEL[inv.invoiceStatus] ?? inv.invoiceStatus}
                </Badge>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CustomerPaymentList({
  payments,
  visibleColumns,
}: {
  payments: PaymentRow[];
  visibleColumns?: Set<string>;
}) {
  if (payments.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
        No payments recorded for this customer.
      </div>
    );
  }

  const show = (key: string) => isColumnVisible(visibleColumns, key);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {show('paymentDate') && <TableHead>Payment Date</TableHead>}
          {show('invoice') && <TableHead>Invoice #</TableHead>}
          {show('reference') && <TableHead>Reference</TableHead>}
          {show('amount') && (
            <TableHead className="text-right">Amount</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((p) => (
          <TableRow key={p.id}>
            {show('paymentDate') && (
              <TableCell>{formatDate(p.paymentDate)}</TableCell>
            )}
            {show('invoice') && (
              <TableCell className="font-mono text-xs">
                {p.invoiceNumber}
              </TableCell>
            )}
            {show('reference') && (
              <TableCell className="text-xs">{p.paymentRef ?? '—'}</TableCell>
            )}
            {show('amount') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(p.amount))}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
