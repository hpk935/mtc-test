import { NotFoundState } from '@/components/layout/not-found-state';

export default function InvoiceNotFound() {
  return (
    <NotFoundState
      title="Invoice not found"
      description="This invoice doesn't exist."
      backHref="/invoices"
      backLabel="Back to Invoices"
    />
  );
}
