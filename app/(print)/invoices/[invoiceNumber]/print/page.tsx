import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { getInvoicePrintData } from '@/features/invoices/queries';
import { InvoicePrintSheet } from '@/features/invoices/components/invoice-print-sheet';

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  await requirePermission('invoices:view');
  const { invoiceNumber } = await params;
  const data = await getInvoicePrintData(invoiceNumber);

  if (!data) {
    notFound();
  }

  return <InvoicePrintSheet data={data} />;
}
