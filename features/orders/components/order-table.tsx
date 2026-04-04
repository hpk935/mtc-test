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
import type { OrderListItem } from '@/features/orders/queries';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> =
  {
    open: 'default',
    invoiced: 'secondary',
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

interface OrderTableProps {
  orders: OrderListItem[];
}

export function OrderTable({ orders }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No orders found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Ship To</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.orderNumber} className="group">
            <TableCell className="font-medium">
              <Link
                href={`/orders/${order.orderNumber}`}
                className="block group-hover:underline">
                {order.orderNumber}
              </Link>
            </TableCell>
            <TableCell>
              <Link
                href={`/customers/${order.customerNumber}`}
                className="hover:underline">
                {order.customerName}
              </Link>
              <span className="text-muted-foreground ml-1 text-xs">
                {order.customerNumber}
              </span>
            </TableCell>
            <TableCell>{formatDate(order.orderDate)}</TableCell>
            <TableCell>
              {order.shipToName}
              <span className="text-muted-foreground block text-xs">
                {order.shipToCity}, {order.shipToStateCode}
              </span>
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(order.totalAmount)}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[order.orderStatus] ?? 'secondary'}>
                {STATUS_LABEL[order.orderStatus] ?? order.orderStatus}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
