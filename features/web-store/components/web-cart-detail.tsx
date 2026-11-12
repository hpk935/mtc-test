import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime, formatMoney } from '../format';
import type { WebCart } from '../types';
import { DetailRow, ProductSummary } from './detail-parts';
import { WebCartStatusBadge } from './web-cart-status-badge';

export function WebCartDetailView({ cart }: { cart: WebCart }) {
  const money = (amount: number) => formatMoney(amount, cart.currencyCode);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="min-w-0 space-y-6 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Cart Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Status">
              <WebCartStatusBadge status={cart.status} />
            </DetailRow>
            <DetailRow label="Created">
              {formatDateTime(cart.createdAt)}
            </DetailRow>
            <DetailRow label="Last Updated">
              {formatDateTime(cart.updatedAt)}
            </DetailRow>
            {cart.status !== 'completed' && (
              <DetailRow
                label={cart.status === 'expired' ? 'Expired' : 'Expires'}>
                {formatDateTime(cart.expiresAt)}
              </DetailRow>
            )}
            <DetailRow label="Shopify Cart">
              <span className="font-mono text-xs">{cart.shopifyCartId}</span>
            </DetailRow>
            <DetailRow label="Items">{cart.totalQuantity}</DetailRow>
            <DetailRow label="Total">{money(cart.totalAmount)}</DetailRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Email">
              {cart.email ? (
                <a
                  href={`mailto:${cart.email}`}
                  className="text-primary dark:text-primary-accent hover:underline">
                  {cart.email}
                </a>
              ) : (
                '—'
              )}
            </DetailRow>
            <DetailRow label="Phone">{cart.phone || '—'}</DetailRow>
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Cart Items{' '}
              <span className="text-muted-foreground font-normal">
                ({cart.lineItems.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.lineItems.map((item, i) => (
                    <TableRow key={`${item.variantId}-${i}`}>
                      <TableCell>
                        <ProductSummary
                          name={item.title}
                          sku={item.sku}
                          imageUrl={item.imageUrl}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {money(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {money(item.unitPrice * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end border-t px-4 py-3 text-sm">
                <span className="text-muted-foreground mr-4">Total</span>
                <span className="font-semibold">{money(cart.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
