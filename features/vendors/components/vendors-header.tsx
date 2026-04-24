import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VendorsHeader({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Vendors</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Suppliers and overhead vendors.
        </p>
      </div>
      {isAdmin && (
        <Button asChild>
          <Link href="/vendors/new">
            <Plus className="mr-2 size-4" />
            New Vendor
          </Link>
        </Button>
      )}
    </div>
  );
}
