import { notFound, redirect } from 'next/navigation';
import { getSalespersons } from '@/features/customers/queries';
import { FREIGHT_TERMS } from '@/features/customers/constants';
import { getOrderForEdit } from '@/features/orders/queries';
import { OrderForm } from '@/features/orders/components/order-form';
import {
  getTermOptions,
  getTerritoryOptions,
} from '@/features/reference-codes/queries';
import { requireAdmin } from '@/lib/auth';

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  await requireAdmin();
  const { orderNumber } = await params;

  const [data, salespersons] = await Promise.all([
    getOrderForEdit(orderNumber),
    getSalespersons(),
  ]);

  if (!data) notFound();
  // Only open orders are editable; send anything else back to its detail page.
  if (data.order.orderStatus !== 'open') redirect(`/orders/${orderNumber}`);

  const [termOptions, territoryOptions] = await Promise.all([
    getTermOptions(data.order.termCode),
    getTerritoryOptions(data.order.territoryCode),
  ]);

  const initialData = {
    customerNumber: data.order.customerNumber,
    customerName: data.customerName ?? data.order.customerNumber,
    salespersonCode: data.order.salespersonCode,
    orderDate: data.order.orderDate,
    customerPoReference: data.order.customerPoReference,
    freightTerm: data.order.freightTerm,
    shipToId: data.order.shipToId,
    termCode: data.order.termCode,
    territoryCode: data.order.territoryCode,
    freightAmount: data.order.freightAmount,
    salesTaxAmount: data.order.salesTaxAmount,
    creditAmount: data.order.creditAmount,
    shippingNote: data.order.shippingNote,
    lineItems: data.items,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Order {orderNumber}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Update order details and line items.
        </p>
      </div>
      <OrderForm
        salespersons={salespersons}
        termOptions={termOptions}
        territoryOptions={territoryOptions}
        freightTerms={FREIGHT_TERMS}
        orderNumber={orderNumber}
        initialData={initialData}
      />
    </div>
  );
}
