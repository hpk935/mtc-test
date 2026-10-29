import Link from 'next/link';
import { ClickableRow } from '@/components/data/clickable-row';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import type { CustomerInvoiceItem } from '@/features/invoices/queries';

const STATUS_VARIANT: Record<
  string,
  'info' | 'warning' | 'success' | 'destructive'
> = {
  open: 'info',
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

const PAGE_SIZE = 10;

interface PurchaseHistoryProps {
  invoices: CustomerInvoiceItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export function PurchaseHistory({
  invoices,
  totalCount,
  totalPages,
  currentPage,
}: PurchaseHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Purchase History{' '}
          <span className="text-muted-foreground font-normal">
            ({totalCount})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-0">
        {totalCount === 0 ? (
          <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
            No invoices for this customer.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <ClickableRow
                      key={invoice.invoiceNumber}
                      href={`/invoices/${invoice.invoiceNumber}`}>
                      <TableCell className="font-medium">
                        <Link href={`/invoices/${invoice.invoiceNumber}`}>
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANT[invoice.invoiceStatus] ?? 'secondary'
                          }>
                          {STATUS_LABEL[invoice.invoiceStatus] ??
                            invoice.invoiceStatus}
                        </Badge>
                      </TableCell>
                    </ClickableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              label="invoices"
              paramName="invoicesPage"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
