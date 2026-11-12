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
import type { WebCartListItem } from '../types';
import { WebCartStatusBadge } from './web-cart-status-badge';

export function WebCartTable({ carts }: { carts: WebCartListItem[] }) {
  if (carts.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No web carts found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer Email</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead className="text-right">Items</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {carts.map((cart) => {
          const href = `/web-carts/${cart.id}`;
          return (
            <ClickableRow key={cart.id} href={href}>
              <TableCell className="font-medium">
                <Link href={href} className="block">
                  {cart.email || '—'}
                </Link>
              </TableCell>
              <TableCell>{formatDateTime(cart.updatedAt)}</TableCell>
              <TableCell className="text-right">{cart.totalQuantity}</TableCell>
              <TableCell className="text-right">
                {formatMoney(cart.totalAmount, cart.currencyCode)}
              </TableCell>
              <TableCell>
                <WebCartStatusBadge status={cart.status} />
              </TableCell>
            </ClickableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
