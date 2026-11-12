import { NotFoundState } from '@/components/layout/not-found-state';

export default function WebOrderNotFound() {
  return (
    <NotFoundState
      title="Web order not found"
      description="No order with this number was placed on the online store."
      backHref="/web-orders"
      backLabel="Back to Web Orders"
    />
  );
}
