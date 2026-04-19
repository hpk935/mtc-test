import { getSalespersons } from '@/features/customers/queries';
import { FREIGHT_TERMS } from '@/features/customers/constants';
import { OrderForm } from '@/features/orders/components/order-form';
import { requireAdmin } from '@/lib/auth';

export default async function NewOrderPage() {
  await requireAdmin();
  const salespersons = await getSalespersons();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Order</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create a new customer order with line items.
        </p>
      </div>
      <OrderForm salespersons={salespersons} freightTerms={FREIGHT_TERMS} />
    </div>
  );
}
