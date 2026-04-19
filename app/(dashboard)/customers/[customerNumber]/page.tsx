import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  findCustomerByNumber,
  getSalespersons,
  getShipToAddresses,
} from '@/features/customers/queries';
import { getInvoicesByCustomer } from '@/features/invoices/queries';
import { CustomerForm } from '@/features/customers/components/customer-form';
import { PurchaseHistory } from '@/features/customers/components/customer-orders';
import { requirePermission } from '@/lib/auth';

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ customerNumber: string }>;
  searchParams: Promise<{ invoicesPage?: string }>;
}) {
  const session = await requirePermission('customers:view');
  const { customerNumber } = await params;
  const { invoicesPage } = await searchParams;
  const invoicesCurrentPage = Math.max(1, Number(invoicesPage) || 1);

  const [customer, salespersons, shipToResult, invoicesResult] =
    await Promise.all([
      findCustomerByNumber(customerNumber),
      getSalespersons(),
      getShipToAddresses(customerNumber),
      getInvoicesByCustomer(customerNumber, { page: invoicesCurrentPage }),
    ]);

  if (!customer) {
    notFound();
  }

  const shipToAddresses = shipToResult.rows;

  const customerData = {
    customerNumber: customer.customerNumber,
    customerName: customer.customerName,
    primaryContactName: customer.primaryContactName,
    billingAddress1: customer.billingAddress1,
    billingAddress2: customer.billingAddress2,
    billingCity: customer.billingCity,
    billingStateCode: customer.billingStateCode,
    billingPostalCode: customer.billingPostalCode,
    countryCode: customer.countryCode,
    mainPhone: customer.mainPhone,
    phoneExtension: customer.phoneExtension,
    faxNumber: customer.faxNumber,
    mainEmail: customer.mainEmail,
    taxId: customer.taxId,
    termCode: customer.termCode,
    territoryCode: customer.territoryCode,
    salespersonCode: customer.salespersonCode,
    defaultFreightTerm: customer.defaultFreightTerm,
    accountStatus: customer.accountStatus,
    accountOpenDate: customer.accountOpenDate,
    customerNote: customer.customerNote,
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/customers">
          <ArrowLeft className="mr-2 size-4" />
          Back to Customers
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {customer.customerName}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Customer {customerNumber}
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <CustomerForm
            key={String(customer.updatedAt)}
            salespersons={salespersons}
            customer={customerData}
            mode="edit"
            shipToAddresses={shipToAddresses}
            readOnly={session.role !== 'admin'}
          />
        </div>
        <div className="xl:col-span-2">
          <div className="sticky top-6">
            <PurchaseHistory
              invoices={invoicesResult.invoices}
              totalCount={invoicesResult.totalCount}
              totalPages={invoicesResult.totalPages}
              currentPage={invoicesCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
