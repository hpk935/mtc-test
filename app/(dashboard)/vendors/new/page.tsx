import { requireAdmin } from '@/lib/auth';
import { VendorForm } from '@/features/vendors/components/vendor-form';

export default async function NewVendorPage() {
  await requireAdmin();
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Vendor</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create a new vendor record.
        </p>
      </div>
      <VendorForm mode="create" />
    </div>
  );
}
