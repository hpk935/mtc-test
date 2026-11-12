import { EditReferenceCodePage } from '@/features/reference-codes/components/reference-code-pages';

export default function EditFreightTermPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return <EditReferenceCodePage kind="freightTerm" params={params} />;
}
