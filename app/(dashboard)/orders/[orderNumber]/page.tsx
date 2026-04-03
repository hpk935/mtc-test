import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findOrderByNumber, getOrderItems } from '@/features/orders/queries';
import { OrderDetailView } from '@/features/orders/components/order-detail';
import { OrderActions } from '@/features/orders/components/order-actions';

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { orderNumber } = await params;
  const { page: pageParam } = await searchParams;
  const itemsPage = Math.max(1, Number(pageParam) || 1);

  const [order, { items, totalCount, totalPages }] = await Promise.all([
    findOrderByNumber(orderNumber),
    getOrderItems({ orderNumber, page: itemsPage }),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/orders">
          <ArrowLeft className="mr-2 size-4" />
          Back to Orders
        </Link>
      </Button>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Order {orderNumber}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {order.customerName} &middot; {order.orderDate}
          </p>
        </div>
        <OrderActions
          orderNumber={orderNumber}
          orderStatus={order.orderStatus}
        />
      </div>
      <OrderDetailView
        order={order}
        items={items}
        currentPage={itemsPage}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  );
}
