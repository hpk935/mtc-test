import { NotFoundState } from '@/components/layout/not-found-state';

export default function PurchaseOrderNotFound() {
  return (
    <NotFoundState
      title="Purchase order not found"
      description="This purchase order doesn't exist or the link is incorrect."
      backHref="/purchase-orders"
      backLabel="Back to Purchase Orders"
    />
  );
}
