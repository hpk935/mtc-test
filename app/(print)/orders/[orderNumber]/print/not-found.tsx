import { NotFoundState } from '@/components/layout/not-found-state';

export default function PrintOrderNotFound() {
  return (
    <NotFoundState
      fullScreen
      title="Order not found"
      description="There's no pick sheet to print because this order doesn't exist."
      backHref="/orders"
      backLabel="Back to Orders"
    />
  );
}
