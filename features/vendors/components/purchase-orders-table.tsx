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
import { formatCurrency, formatDate } from '@/lib/utils';
import { PO_STATUS_LABEL } from '../constants';
import type { PurchaseOrderListItem } from '../queries';

const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive'
> = {
  draft: 'secondary',
  ordered: 'warning',
  partially_received: 'warning',
  received: 'success',
  cancelled: 'destructive',
};

export function PurchaseOrdersTable({
  rows,
  showVendor = true,
}: {
  rows: PurchaseOrderListItem[];
  showVendor?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No purchase orders found.
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>PO #</TableHead>
          {showVendor && <TableHead>Vendor</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Order Date</TableHead>
          <TableHead>Expected</TableHead>
          <TableHead>Received</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((po) => (
          <TableRow key={po.id} className="group">
            <TableCell className="font-medium">
              <Link
                href={`/purchase-orders/${po.id}`}
                className="block group-hover:underline">
                {po.poNumber}
              </Link>
            </TableCell>
            {showVendor && (
              <TableCell>
                <Link
                  href={`/vendors/${po.vendorId}`}
                  className="hover:underline">
                  {po.vendorName}
                </Link>
                <span className="text-muted-foreground block text-xs">
                  {po.vendorCode}
                </span>
              </TableCell>
            )}
            <TableCell>
              <Badge variant={STATUS_VARIANT[po.status] ?? 'secondary'}>
                {PO_STATUS_LABEL[po.status]}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(po.orderDate)}</TableCell>
            <TableCell>
              {po.expectedDate ? formatDate(po.expectedDate) : '—'}
            </TableCell>
            <TableCell>
              {po.receivedDate ? formatDate(po.receivedDate) : '—'}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(Number(po.totalAmount))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
