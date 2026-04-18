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
import { TrackingNumberForm } from './tracking-number-form';
import type { OrderDetail, OrderItemDetail } from '@/features/orders/queries';

const STATUS_VARIANT: Record<string, 'success' | 'info' | 'destructive'> = {
  open: 'success',
  invoiced: 'info',
  voided: 'destructive',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  invoiced: 'Invoiced',
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

interface OrderDetailViewProps {
  order: OrderDetail;
  items: OrderItemDetail[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  invoiceNumbers: string[];
}

const ITEMS_PAGE_SIZE = 20;

export function OrderDetailView({
  order,
  items,
  currentPage,
  totalPages,
  totalCount,
  invoiceNumbers,
}: OrderDetailViewProps) {
  const salesperson =
    order.salespersonFirstName && order.salespersonLastName
      ? `${order.salespersonFirstName} ${order.salespersonLastName}`
      : order.salespersonCode;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left column — info cards */}
      <div className="space-y-6 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Order Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Status">
              <Badge variant={STATUS_VARIANT[order.orderStatus] ?? 'secondary'}>
                {STATUS_LABEL[order.orderStatus] ?? order.orderStatus}
              </Badge>
            </DetailRow>
            <DetailRow label="Date">{formatDate(order.orderDate)}</DetailRow>
            {invoiceNumbers.length > 0 && (
              <DetailRow
                label={invoiceNumbers.length === 1 ? 'Invoice' : 'Invoices'}>
                <span className="space-x-1">
                  {invoiceNumbers.map((num, i) => (
                    <span key={num}>
                      {i > 0 && (
                        <span className="text-muted-foreground">,</span>
                      )}
                      <Link
                        href={`/invoices/${num}`}
                        className="text-primary hover:underline">
                        {num}
                      </Link>
                    </span>
                  ))}
                </span>
              </DetailRow>
            )}
            {order.customerPoReference && (
              <DetailRow label="PO #">{order.customerPoReference}</DetailRow>
            )}
            <DetailRow label="Terms">{order.termCode}</DetailRow>
            <DetailRow label="Territory">{order.territoryCode}</DetailRow>
            <DetailRow label="Freight">{order.freightTerm}</DetailRow>
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
                href={`/customers/${order.customerNumber}`}
                className="text-primary hover:underline">
                {order.customerName}
              </Link>
            </DetailRow>
            <DetailRow label="Account #">{order.customerNumber}</DetailRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ship To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p className="font-medium">{order.shipToName}</p>
              <p className="text-muted-foreground">{order.shipToAddress1}</p>
              {order.shipToAddress2 && (
                <p className="text-muted-foreground">{order.shipToAddress2}</p>
              )}
              <p className="text-muted-foreground">
                {order.shipToCity}, {order.shipToStateCode}{' '}
                {order.shipToPostalCode}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tracking Number</CardTitle>
          </CardHeader>
          <CardContent>
            <TrackingNumberForm
              orderNumber={order.orderNumber}
              trackingNumber={order.trackingNumber}
            />
          </CardContent>
        </Card>

        {order.shippingNote && (
          <Card>
            <CardHeader>
              <CardTitle>Shipping Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {order.shippingNote}
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
            <CardTitle>Order Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Subtotal">
              {formatCurrency(order.subtotalAmount)}
            </DetailRow>
            <DetailRow label="Sales Tax">
              {formatCurrency(order.salesTaxAmount)}
            </DetailRow>
            <DetailRow label="Freight">
              {formatCurrency(order.freightAmount)}
            </DetailRow>
            <Separator />
            <DetailRow label="Total">
              <span className="text-base">
                {formatCurrency(order.totalAmount)}
              </span>
            </DetailRow>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
