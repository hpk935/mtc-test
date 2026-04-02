import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProductsHeader() {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Products</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse the product catalog and view inventory levels
        </p>
      </div>
      <Button asChild>
        <Link href="/products/new">
          <Plus className="mr-2 size-4" />
          Add Product
        </Link>
      </Button>
    </div>
  );
}
