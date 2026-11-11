import { NotFoundState } from '@/components/layout/not-found-state';

export default function PrintPurchaseOrderNotFound() {
  return (
    <NotFoundState
      fullScreen
      title="Purchase order not found"
      description="There's nothing to print because this purchase order doesn't exist."
      backHref="/purchase-orders"
      backLabel="Back to Purchase Orders"
    />
  );
}
