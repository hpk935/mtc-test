import { notFound } from 'next/navigation';
import { parseIdParam } from '@/lib/params';
import {
  findPurchaseOrderById,
  getActiveVendorsForSelect,
} from '@/features/vendors/queries';
import { PurchaseOrderForm } from '@/features/vendors/components/purchase-order-form';
import { requireAdmin } from '@/lib/auth';

export default async function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const numericId = parseIdParam(id);
  if (numericId === null) notFound();

  const po = await findPurchaseOrderById(numericId);
  if (!po) notFound();
  if (po.status !== 'draft') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">{po.poNumber}</h1>
        <p className="text-muted-foreground text-sm">
          Only draft purchase orders can be edited.
        </p>
      </div>
    );
  }

  const vendors = await getActiveVendorsForSelect();

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit {po.poNumber}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Modify a draft purchase order.
        </p>
      </div>
      <PurchaseOrderForm
        vendors={vendors}
        mode="edit"
        purchaseOrder={{
          id: po.id,
          vendorId: po.vendorId,
          orderDate: po.orderDate,
          expectedDate: po.expectedDate,
          freightAmount: po.freightAmount,
          notes: po.notes,
          vessel: po.vessel,
          vendorInvoiceNumber: po.vendorInvoiceNumber,
          items: po.items.map((i) => ({
            productId: i.productId,
            itemNumber: i.itemNumber,
            description: i.description,
            qtyOrdered: i.qtyOrdered,
            unitCost: i.unitCost,
          })),
        }}
      />
    </div>
  );
}
