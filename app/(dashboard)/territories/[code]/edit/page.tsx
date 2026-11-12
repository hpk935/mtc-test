import { EditReferenceCodePage } from '@/features/reference-codes/components/reference-code-pages';

export default function EditTerritoryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return <EditReferenceCodePage kind="territory" params={params} />;
}
