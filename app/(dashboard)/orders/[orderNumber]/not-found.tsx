import { NotFoundState } from '@/components/layout/not-found-state';

export default function OrderNotFound() {
  return (
    <NotFoundState
      title="Order not found"
      description="This order doesn't exist or may have been deleted."
      backHref="/orders"
      backLabel="Back to Orders"
    />
  );
}
