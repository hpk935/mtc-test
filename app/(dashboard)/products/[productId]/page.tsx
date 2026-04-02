import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findProductById } from '@/features/products/queries';
import { ProductForm } from '@/features/products/components/product-form';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await findProductById(Number(productId));

  if (!product) {
    notFound();
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/products">
          <ArrowLeft className="mr-2 size-4" />
          Back to Products
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {product.description}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Product {product.itemNumber} &middot; Edit details below
        </p>
      </div>
      <ProductForm product={product} mode="edit" />
    </div>
  );
}
