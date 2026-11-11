import { NotFoundState } from '@/components/layout/not-found-state';

export default function PrintInvoiceNotFound() {
  return (
    <NotFoundState
      fullScreen
      title="Invoice not found"
      description="There's nothing to print because this invoice doesn't exist."
      backHref="/invoices"
      backLabel="Back to Invoices"
    />
  );
}
