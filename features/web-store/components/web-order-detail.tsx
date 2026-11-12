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
import type { WebOrder } from '../types';
import { DetailRow, ProductSummary } from './detail-parts';

export function WebOrderDetailView({ order }: { order: WebOrder }) {
  const addr = order.shippingAddress;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="min-w-0 space-y-6 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Order Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Placed">
              {formatDateTime(order.createdAt)}
            </DetailRow>
            <DetailRow label="Items">{order.items.length}</DetailRow>
            <DetailRow label="Total">{formatMoney(order.totalPrice)}</DetailRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Email">
              <a
                href={`mailto:${order.contactInfo.email}`}
                className="text-primary dark:text-primary-accent hover:underline">
                {order.contactInfo.email}
              </a>
            </DetailRow>
            <DetailRow label="Phone">
              {order.contactInfo.phone || '—'}
            </DetailRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ship To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p className="font-medium">
                {addr.firstName} {addr.lastName}
              </p>
              <p className="text-muted-foreground">{addr.streetAddress}</p>
              {addr.address2 && (
                <p className="text-muted-foreground">{addr.address2}</p>
              )}
              <p className="text-muted-foreground">
                {addr.city}, {addr.state} {addr.postalZip}
              </p>
              <p className="text-muted-foreground">{addr.country}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Note</CardTitle>
          </CardHeader>
          <CardContent>
            {order.note ? (
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {order.note}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm italic">No note</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Line Items{' '}
              <span className="text-muted-foreground font-normal">
                ({order.items.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {order.items.length === 0 ? (
              <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
                No line items.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Price / Case</TableHead>
                      <TableHead className="text-right">Cases</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item, i) => (
                      <TableRow key={`${item.sku}-${i}`}>
                        <TableCell>
                          <ProductSummary
                            name={item.name}
                            sku={item.sku}
                            imageUrl={item.imageUrl}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(item.amountPerQuantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(item.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end border-t px-4 py-3 text-sm">
                  <span className="text-muted-foreground mr-4">Total</span>
                  <span className="font-semibold">
                    {formatMoney(order.totalPrice)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
