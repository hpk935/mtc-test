import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/features/products/components/product-form';
import { requireAdmin } from '@/lib/auth';

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <div className="flex w-full flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/products">
          <ArrowLeft className="mr-2 size-4" />
          Back to Products
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Product</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add a new product to the catalog
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
