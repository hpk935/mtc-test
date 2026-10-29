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
import { InvoiceStatusAction } from './invoice-status-action';
import { ApplyPaymentDialog } from './apply-payment-dialog';
import type {
  InvoiceDetail,
  InvoiceItemDetail,
  PaymentRecord,
} from '@/features/invoices/queries';
import type { InvoiceStatus } from '@/features/invoices/constants';

const STATUS_VARIANT: Record<
  string,
  'info' | 'warning' | 'success' | 'destructive'
> = {
  open: 'info',
  paid: 'success',
  partially_paid: 'warning',
  voided: 'destructive',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  paid: 'Paid',
  partially_paid: 'Partial',
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
  invoiceStatus: InvoiceStatus;
  items: InvoiceItemDetail[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  payments: PaymentRecord[];
}

const ITEMS_PAGE_SIZE = 20;

export function InvoiceDetailView({
  invoice,
  invoiceStatus,
  items,
  currentPage,
  totalPages,
  totalCount,
  payments,
}: InvoiceDetailViewProps) {
  const salesperson =
    invoice.salespersonFirstName && invoice.salespersonLastName
      ? `${invoice.salespersonFirstName} ${invoice.salespersonLastName}`
      : invoice.salespersonCode;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left column — info cards */}
      <div className="min-w-0 space-y-6 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Status">
              <InvoiceStatusAction
                invoiceNumber={invoice.invoiceNumber}
                currentStatus={invoiceStatus}
                hasPayments={payments.length > 0}
              />
            </DetailRow>
            <DetailRow label="Date">
              {formatDate(invoice.invoiceDate)}
            </DetailRow>
            <DetailRow label="Order">
              <Link
                href={`/orders/${invoice.orderNumber}`}
                className="text-primary dark:text-primary-accent hover:underline">
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
                className="text-primary dark:text-primary-accent hover:underline">
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

        {invoice.trackingNumber && (
          <Card>
            <CardHeader>
              <CardTitle>Tracking Number</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{invoice.trackingNumber}</p>
            </CardContent>
          </Card>
        )}

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

      {/* Right column — AR, totals, line items */}
      <div className="min-w-0 space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Receivables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Amount Paid">
              {formatCurrency(invoice.amountPaid)}
            </DetailRow>
            <DetailRow label="Balance Due">
              {formatCurrency(invoice.balanceDue)}
            </DetailRow>
            {invoice.dueDate && (
              <DetailRow label="Due Date">
                {formatDate(invoice.dueDate)}
              </DetailRow>
            )}
            {invoice.paidDate && (
              <DetailRow label="Paid Date">
                {formatDate(invoice.paidDate)}
              </DetailRow>
            )}
            {invoice.paymentRef && (
              <DetailRow label="Payment Ref">{invoice.paymentRef}</DetailRow>
            )}
            {(invoiceStatus === 'open' ||
              invoiceStatus === 'partially_paid') && (
              <div className="pt-2">
                <ApplyPaymentDialog
                  invoiceNumber={invoice.invoiceNumber}
                  totalAmount={invoice.totalAmount}
                  balanceDue={invoice.balanceDue}
                />
              </div>
            )}
            {payments.length > 0 && (
              <>
                <Separator />
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-medium select-none">
                    <span>
                      Payment History{' '}
                      <span className="text-muted-foreground font-normal">
                        ({payments.length})
                      </span>
                    </span>
                    <svg
                      className="text-muted-foreground h-4 w-4 transition-transform group-open:rotate-180"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </summary>
                  <div className="mt-3 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{formatDate(p.paymentDate)}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(p.amount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {p.paymentRef || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </details>
              </>
            )}
          </CardContent>
        </Card>

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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Ordered</TableHead>
                        <TableHead className="text-right">Shipped</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-right">Weight</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/products?search=${item.itemNumber}`}
                              className="hover:underline">
                              {item.itemNumber}
                            </Link>
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
                            {item.caseWeight && item.maxQty
                              ? (
                                  (item.qtyOrdered * Number(item.caseWeight)) /
                                  item.maxQty
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) + ' lbs'
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.lineTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
            <DetailRow label="Total Weight">
              {items
                .reduce(
                  (sum, item) =>
                    sum +
                    (item.caseWeight && item.maxQty
                      ? (item.qtyOrdered * Number(item.caseWeight)) /
                        item.maxQty
                      : 0),
                  0,
                )
                .toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
              lbs
            </DetailRow>
            <Separator />
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
