import Link from 'next/link';
import { ClickableRow } from '@/components/data/clickable-row';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime, formatMoney } from '../format';
import type { WebOrderListItem } from '../types';

export function WebOrderTable({ orders }: { orders: WebOrderListItem[] }) {
  if (orders.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No web orders found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Ship To</TableHead>
          <TableHead className="text-right">Items</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const href = `/web-orders/${encodeURIComponent(order.orderNumber)}`;
          return (
            <ClickableRow key={order.orderNumber} href={href}>
              <TableCell className="font-medium">
                <Link href={href} className="block">
                  {order.orderNumber}
                </Link>
              </TableCell>
              <TableCell>{formatDateTime(order.createdAt)}</TableCell>
              <TableCell>{order.email}</TableCell>
              <TableCell>{order.shipToName}</TableCell>
              <TableCell className="text-right">{order.itemCount}</TableCell>
              <TableCell className="text-right">
                {formatMoney(order.totalPrice)}
              </TableCell>
            </ClickableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
