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

const ORDER_STATUS_STYLES: Record<string, string> = {
  open: 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-400',
  invoiced:
    'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400',
  voided:
    'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-400',
};

const INVOICE_STATUS_STYLES: Record<string, string> = {
  posted:
    'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400',
  paid: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  voided:
    'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-400',
};

function formatCurrency(value: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
                  <div className="text-sm font-medium">{order.orderNumber}</div>
                  <div className="text-muted-foreground text-xs">
                    {order.customerNumber} &middot; {order.orderDate}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      ORDER_STATUS_STYLES[order.orderStatus] ??
                      ORDER_STATUS_STYLES.open
                    }>
                    {capitalize(order.orderStatus)}
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
                  <div className="text-sm font-medium">
                    {invoice.invoiceNumber}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {invoice.customerNumber} &middot; {invoice.invoiceDate}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatCurrency(invoice.totalAmount)}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      INVOICE_STATUS_STYLES[invoice.invoiceStatus] ??
                      INVOICE_STATUS_STYLES.posted
                    }>
                    {capitalize(invoice.invoiceStatus)}
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
