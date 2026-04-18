import { notFound } from 'next/navigation';
import { getOrderPrintData } from '@/features/orders/queries';
import { OrderPickSheet } from '@/features/orders/components/order-pick-sheet';

export default async function OrderPrintPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const data = await getOrderPrintData(orderNumber);

  if (!data) {
    notFound();
  }

  return <OrderPickSheet data={data} />;
}
