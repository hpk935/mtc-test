import Link from 'next/link';
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
import { Separator } from '@/components/ui/separator';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import type {
  InvoiceDetail,
  InvoiceItemDetail,
} from '@/features/invoices/queries';

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

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

interface InvoiceDetailViewProps {
  invoice: InvoiceDetail;
  items: InvoiceItemDetail[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

const ITEMS_PAGE_SIZE = 20;

export function InvoiceDetailView({
  invoice,
  items,
  currentPage,
  totalPages,
  totalCount,
}: InvoiceDetailViewProps) {
  const salesperson =
    invoice.salespersonFirstName && invoice.salespersonLastName
      ? `${invoice.salespersonFirstName} ${invoice.salespersonLastName}`
      : invoice.salespersonCode;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left column — info cards */}
      <div className="space-y-6 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Status">
              <Badge
                variant={STATUS_VARIANT[invoice.invoiceStatus] ?? 'secondary'}>
                {STATUS_LABEL[invoice.invoiceStatus] ?? invoice.invoiceStatus}
              </Badge>
            </DetailRow>
            <DetailRow label="Date">
              {formatDate(invoice.invoiceDate)}
            </DetailRow>
            <DetailRow label="Order">
              <Link
                href={`/orders/${invoice.orderNumber}`}
                className="hover:underline">
                {invoice.orderNumber}
              </Link>
            </DetailRow>
            {invoice.customerPoReference && (
              <DetailRow label="PO #">{invoice.customerPoReference}</DetailRow>
            )}
            <DetailRow label="Terms">{invoice.termCode}</DetailRow>
            <DetailRow label="Territory">{invoice.territoryCode}</DetailRow>
            <DetailRow label="Freight">{invoice.freightTerm}</DetailRow>
            <DetailRow label="Salesperson">{salesperson}</DetailRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Name">
              <Link
                href={`/customers/${invoice.customerNumber}`}
                className="hover:underline">
                {invoice.customerName}
              </Link>
            </DetailRow>
            <DetailRow label="Account #">{invoice.customerNumber}</DetailRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ship To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p className="font-medium">{invoice.shipToName}</p>
              <p className="text-muted-foreground">{invoice.shipToAddress1}</p>
              {invoice.shipToAddress2 && (
                <p className="text-muted-foreground">
                  {invoice.shipToAddress2}
                </p>
              )}
              <p className="text-muted-foreground">
                {invoice.shipToCity}, {invoice.shipToStateCode}{' '}
                {invoice.shipToPostalCode}
              </p>
            </div>
          </CardContent>
        </Card>

        {invoice.shippingNote && (
          <Card>
            <CardHeader>
              <CardTitle>Shipping Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {invoice.shippingNote}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right column — line items + totals */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Line Items{' '}
              <span className="text-muted-foreground font-normal">
                ({totalCount})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {totalCount === 0 ? (
              <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
                No line items.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Ordered</TableHead>
                      <TableHead className="text-right">Shipped</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.itemNumber}
                        </TableCell>
                        <TableCell className="max-w-60 truncate">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.qtyOrdered}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.qtyShipped}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(item.discount) > 0
                            ? formatCurrency(item.discount)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.lineTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={ITEMS_PAGE_SIZE}
                  label="items"
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Subtotal">
              {formatCurrency(invoice.subtotalAmount)}
            </DetailRow>
            <DetailRow label="Sales Tax">
              {formatCurrency(invoice.salesTaxAmount)}
            </DetailRow>
            <DetailRow label="Freight">
              {formatCurrency(invoice.freightAmount)}
            </DetailRow>
            <Separator />
            <DetailRow label="Total">
              <span className="text-base">
                {formatCurrency(invoice.totalAmount)}
              </span>
            </DetailRow>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
