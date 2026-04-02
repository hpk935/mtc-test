import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  findInvoiceByNumber,
  getInvoiceItems,
} from '@/features/invoices/queries';
import { InvoiceDetailView } from '@/features/invoices/components/invoice-detail';

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

  const [invoice, { items, totalCount, totalPages }] = await Promise.all([
    findInvoiceByNumber(invoiceNumber),
    getInvoiceItems({ invoiceNumber, page: itemsPage }),
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Invoice {invoiceNumber}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {invoice.customerName} &middot; {invoice.invoiceDate}
        </p>
      </div>
      <InvoiceDetailView
        invoice={invoice}
        items={items}
        currentPage={itemsPage}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  );
}
