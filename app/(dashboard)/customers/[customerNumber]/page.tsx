import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerNumber: string }>;
}) {
  const { customerNumber } = await params;

  return (
    <div className="flex w-full flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/customers">
          <ArrowLeft className="mr-2 size-4" />
          Back to Customers
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Customer {customerNumber}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Customer details and history
        </p>
      </div>
      <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
        Customer detail view coming soon.
      </div>
    </div>
  );
}
