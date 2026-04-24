import { requirePermission } from '@/lib/auth';
import { getActiveVendorsForSelect } from '@/features/vendors/queries';
import { PurchaseOrderForm } from '@/features/vendors/components/purchase-order-form';

export default async function NewPurchaseOrderPage() {
  await requirePermission('vendors:view');
  const vendors = await getActiveVendorsForSelect();

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          New Purchase Order
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Draft a purchase order. Stock only updates when items are received.
        </p>
      </div>
      <PurchaseOrderForm vendors={vendors} mode="create" />
    </div>
  );
}
