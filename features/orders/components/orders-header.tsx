import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OrdersHeader() {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Orders</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          View and track all customer orders
        </p>
      </div>
      <Button asChild>
        <Link href="/orders/new">
          <Plus className="mr-2 size-4" />
          New Order
        </Link>
      </Button>
    </div>
  );
}
