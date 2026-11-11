import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { parseIdParam } from '@/lib/params';
import { getPurchaseOrderPrintData } from '@/features/vendors/queries';
import { PurchaseOrderPrintSheet } from '@/features/vendors/components/purchase-order-print-sheet';

export default async function PurchaseOrderPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission('vendors:view');
  const { id } = await params;
  const numericId = parseIdParam(id);
  if (numericId === null) notFound();

  const data = await getPurchaseOrderPrintData(numericId);
  if (!data) notFound();

  return <PurchaseOrderPrintSheet data={data} />;
}
