import { NotFoundState } from '@/components/layout/not-found-state';

export default function VendorNotFound() {
  return (
    <NotFoundState
      title="Vendor not found"
      description="This vendor doesn't exist or the link is incorrect."
      backHref="/vendors"
      backLabel="Back to Vendors"
    />
  );
}
