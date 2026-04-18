import { requireAuth } from '@/lib/auth';

export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return <>{children}</>;
}
