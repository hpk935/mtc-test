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
import { DataTablePagination } from '@/components/data/data-table-pagination';
import type { CustomerOrderItem } from '@/features/orders/queries';

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

const PAGE_SIZE = 10;

interface CustomerOrdersProps {
  orders: CustomerOrderItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export function CustomerOrders({
  orders,
  totalCount,
  totalPages,
  currentPage,
}: CustomerOrdersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Orders{' '}
          <span className="text-muted-foreground font-normal">
            ({totalCount})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-0">
        {totalCount === 0 ? (
          <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
            No orders for this customer.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
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
                        className="group-hover:underline">
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          STATUS_VARIANT[order.orderStatus] ?? 'secondary'
                        }>
                        {STATUS_LABEL[order.orderStatus] ?? order.orderStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              label="orders"
              paramName="ordersPage"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
