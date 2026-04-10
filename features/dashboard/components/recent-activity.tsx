import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RecentOrder {
  orderNumber: string;
  customerNumber: string;
  orderDate: string;
  totalAmount: string;
  orderStatus: string;
}

interface RecentInvoice {
  invoiceNumber: string;
  customerNumber: string;
  invoiceDate: string;
  totalAmount: string;
  invoiceStatus: string;
}

const ORDER_STATUS_VARIANT: Record<string, 'success' | 'info' | 'destructive'> =
  {
    open: 'success',
    invoiced: 'info',
    voided: 'destructive',
  };

const INVOICE_STATUS_VARIANT: Record<
  string,
  'info' | 'warning' | 'success' | 'destructive'
> = {
  open: 'info',
  partially_paid: 'warning',
  paid: 'success',
  voided: 'destructive',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  invoiced: 'Invoiced',
  voided: 'Voided',
};

const INVOICE_STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  partially_paid: 'Partial',
  paid: 'Paid',
  voided: 'Voided',
};

function formatCurrency(value: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value));
}

export function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Latest orders will appear here.</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-muted-foreground text-sm">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.orderNumber}
                className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/orders/${order.orderNumber}`}
                    className="text-sm font-medium hover:underline">
                    {order.orderNumber}
                  </Link>
                  <div className="text-muted-foreground text-xs">
                    {order.customerNumber} &middot; {order.orderDate}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <Badge
                    variant={
                      ORDER_STATUS_VARIANT[order.orderStatus] ?? 'default'
                    }>
                    {ORDER_STATUS_LABEL[order.orderStatus] ?? order.orderStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentInvoices({ invoices }: { invoices: RecentInvoice[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
        <CardDescription>Latest invoices will appear here.</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-muted-foreground text-sm">No invoices yet.</p>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.invoiceNumber}
                className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/invoices/${invoice.invoiceNumber}`}
                    className="text-sm font-medium hover:underline">
                    {invoice.invoiceNumber}
                  </Link>
                  <div className="text-muted-foreground text-xs">
                    {invoice.customerNumber} &middot; {invoice.invoiceDate}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatCurrency(invoice.totalAmount)}
                  </span>
                  <Badge
                    variant={
                      INVOICE_STATUS_VARIANT[invoice.invoiceStatus] ??
                      'secondary'
                    }>
                    {INVOICE_STATUS_LABEL[invoice.invoiceStatus] ??
                      invoice.invoiceStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
