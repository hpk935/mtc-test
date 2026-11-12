import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findWebCart } from '@/features/web-store/queries';
import { formatDateTime } from '@/features/web-store/format';
import { WebCartDetailView } from '@/features/web-store/components/web-cart-detail';
import { requireAdmin } from '@/lib/auth';

export default async function WebCartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const cart = await findWebCart(id);

  if (!cart) {
    notFound();
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/web-carts">
          <ArrowLeft className="mr-2 size-4" />
          Back to Web Carts
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight break-all">
          Cart &middot; {cart.email || 'Unknown customer'}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Last updated {formatDateTime(cart.updatedAt)}
        </p>
      </div>
      <WebCartDetailView cart={cart} />
    </div>
  );
}
