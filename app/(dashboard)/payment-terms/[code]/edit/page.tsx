import { EditReferenceCodePage } from '@/features/reference-codes/components/reference-code-pages';

export default function EditPaymentTermPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return <EditReferenceCodePage kind="term" params={params} />;
}
