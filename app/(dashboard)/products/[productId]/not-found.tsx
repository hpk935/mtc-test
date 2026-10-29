import { NotFoundState } from '@/components/layout/not-found-state';

export default function ProductNotFound() {
  return (
    <NotFoundState
      title="Product not found"
      description="This product doesn't exist or the link is incorrect."
      backHref="/products"
      backLabel="Back to Products"
    />
  );
}
