import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findWebOrder } from '@/features/web-store/queries';
import { formatDateTime } from '@/features/web-store/format';
import { WebOrderDetailView } from '@/features/web-store/components/web-order-detail';
import { ExportWebOrderButton } from '@/features/web-store/components/export-web-order-button';
import { requireAdmin } from '@/lib/auth';

export default async function WebOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  await requireAdmin();
  const { orderNumber } = await params;
  const order = await findWebOrder(decodeURIComponent(orderNumber));

  if (!order) {
    notFound();
  }

  const name =
    `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim();

  return (
    <div className="flex w-full flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/web-orders">
          <ArrowLeft className="mr-2 size-4" />
          Back to Web Orders
        </Link>
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Web Order {order.orderNumber}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {name || order.contactInfo.email} &middot;{' '}
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <ExportWebOrderButton order={order} />
      </div>
      <WebOrderDetailView order={order} />
    </div>
  );
}
