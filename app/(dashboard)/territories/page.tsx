import { ReferenceCodeListPage } from '@/features/reference-codes/components/reference-code-pages';

export default function TerritoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return <ReferenceCodeListPage kind="territory" searchParams={searchParams} />;
}
