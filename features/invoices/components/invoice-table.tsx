import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { InvoiceListItem } from '@/features/invoices/queries';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> =
  {
    posted: 'secondary',
    paid: 'default',
    voided: 'destructive',
  };

const STATUS_LABEL: Record<string, string> = {
  posted: 'Posted',
  paid: 'Paid',
  voided: 'Voided',
};

function formatCurrency(value: string): string {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface InvoiceTableProps {
  invoices: InvoiceListItem[];
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No invoices found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Order #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoiceNumber} className="group">
            <TableCell className="font-medium">
              <Link
                href={`/invoices/${invoice.invoiceNumber}`}
                className="block group-hover:underline">
                {invoice.invoiceNumber}
              </Link>
            </TableCell>
            <TableCell>{invoice.orderNumber}</TableCell>
            <TableCell>
              {invoice.customerName}
              <span className="text-muted-foreground ml-1 text-xs">
                {invoice.customerNumber}
              </span>
            </TableCell>
            <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(invoice.totalAmount)}
            </TableCell>
            <TableCell>
              <Badge
                variant={STATUS_VARIANT[invoice.invoiceStatus] ?? 'secondary'}>
                {STATUS_LABEL[invoice.invoiceStatus] ?? invoice.invoiceStatus}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
