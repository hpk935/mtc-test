import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  findCustomerByNumber,
  getSalespersons,
} from '@/features/customers/queries';
import { CustomerForm } from '@/features/customers/components/customer-form';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerNumber: string }>;
}) {
  const { customerNumber } = await params;

  const [customer, salespersons] = await Promise.all([
    findCustomerByNumber(customerNumber),
    getSalespersons(),
  ]);

  if (!customer) {
    notFound();
  }

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
          Customer {customerNumber} &middot; Edit details below
        </p>
      </div>
      <CustomerForm
        salespersons={salespersons}
        customer={customerData}
        mode="edit"
      />
    </div>
  );
}
