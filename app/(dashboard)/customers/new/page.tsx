import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSalespersons } from '@/features/customers/queries';
import { CustomerForm } from '@/features/customers/components/customer-form';
import { requireAdmin } from '@/lib/auth';

export default async function NewCustomerPage() {
  await requireAdmin();
  const salespersons = await getSalespersons();

  return (
    <div className="flex w-full flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/customers">
          <ArrowLeft className="mr-2 size-4" />
          Back to Customers
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Customer</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Set up a new customer account
        </p>
      </div>
      <CustomerForm salespersons={salespersons} />
    </div>
  );
}
