import { ReferenceCodeListPage } from '@/features/reference-codes/components/reference-code-pages';

export default function PaymentTermsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return <ReferenceCodeListPage kind="term" searchParams={searchParams} />;
}
