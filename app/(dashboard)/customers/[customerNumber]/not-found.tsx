import { NotFoundState } from '@/components/layout/not-found-state';

export default function CustomerNotFound() {
  return (
    <NotFoundState
      title="Customer not found"
      description="No customer matches this customer number."
      backHref="/customers"
      backLabel="Back to Customers"
    />
  );
}
