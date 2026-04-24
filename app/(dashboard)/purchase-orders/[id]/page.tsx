import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { findPurchaseOrderById } from '@/features/vendors/queries';
import { PO_STATUS_LABEL } from '@/features/vendors/constants';
import { PurchaseOrderActions } from '@/features/vendors/components/purchase-order-actions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';

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

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission('vendors:view');
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const po = await findPurchaseOrderById(numericId);
  if (!po) notFound();

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{po.poNumber}</h1>
            <Badge variant={STATUS_VARIANT[po.status] ?? 'secondary'}>
              {PO_STATUS_LABEL[po.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            <Link href={`/vendors/${po.vendorId}`} className="hover:underline">
              {po.vendorName}
            </Link>{' '}
            ({po.vendorCode})
          </p>
        </div>
        <PurchaseOrderActions po={po} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Order Date" value={formatDate(po.orderDate)} />
        <InfoCard
          label="Expected"
          value={po.expectedDate ? formatDate(po.expectedDate) : '—'}
        />
        <InfoCard
          label="Received"
          value={po.receivedDate ? formatDate(po.receivedDate) : '—'}
        />
        <InfoCard label="Created By" value={po.creatorName ?? po.createdBy} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Line Items</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <div className="font-medium">{i.itemNumber}</div>
                    <div className="text-muted-foreground text-xs">
                      {i.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {i.qtyOrdered}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {i.qtyReceived}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(Number(i.unitCost))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(Number(i.lineTotal))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">Notes</h3>
          <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
            {po.notes || '—'}
          </p>
        </div>
        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">
              {formatCurrency(Number(po.subtotalAmount))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Freight</span>
            <span className="tabular-nums">
              {formatCurrency(Number(po.freightAmount))}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">
              {formatCurrency(Number(po.totalAmount))}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
