import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  findInvoiceByNumber,
  getInvoiceItems,
  getPaymentsByInvoice,
} from '@/features/invoices/queries';
import { InvoiceDetailView } from '@/features/invoices/components/invoice-detail';
import type { InvoiceStatus } from '@/features/invoices/constants';

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceNumber: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { invoiceNumber } = await params;
  const { page: pageParam } = await searchParams;
  const itemsPage = Math.max(1, Number(pageParam) || 1);

  const [invoice, { items, totalCount, totalPages }, paymentHistory] =
    await Promise.all([
      findInvoiceByNumber(invoiceNumber),
      getInvoiceItems({ invoiceNumber, page: itemsPage }),
      getPaymentsByInvoice(invoiceNumber),
    ]);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/invoices">
          <ArrowLeft className="mr-2 size-4" />
          Back to Invoices
        </Link>
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Invoice {invoiceNumber}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {invoice.customerName} &middot; {invoice.invoiceDate}
          </p>
        </div>
      </div>
      <InvoiceDetailView
        invoice={invoice}
        invoiceStatus={invoice.invoiceStatus as InvoiceStatus}
        items={items}
        currentPage={itemsPage}
        totalPages={totalPages}
        totalCount={totalCount}
        payments={paymentHistory}
      />
    </div>
  );
}
