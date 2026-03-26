import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CustomersHeader() {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Customers</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          View and manage all customer records in the database
        </p>
      </div>
      <Button asChild>
        <Link href="/customers/new">
          <Plus className="mr-2 size-4" />
          New Customer
        </Link>
      </Button>
    </div>
  );
}
