import { requireAdmin } from '@/lib/auth';
import { getActiveVendorsForSelect } from '@/features/vendors/queries';
import { PurchaseOrderForm } from '@/features/vendors/components/purchase-order-form';

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ vendorId?: string }>;
}) {
  await requireAdmin();
  const vendors = await getActiveVendorsForSelect();
  const { vendorId } = await searchParams;
  const parsed = vendorId ? Number(vendorId) : NaN;
  const defaultVendorId =
    Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;

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
      <PurchaseOrderForm
        vendors={vendors}
        defaultVendorId={defaultVendorId}
        mode="create"
      />
    </div>
  );
}
