import { ReferenceCodeListPage } from '@/features/reference-codes/components/reference-code-pages';

export default function FreightTermsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <ReferenceCodeListPage kind="freightTerm" searchParams={searchParams} />
  );
}
