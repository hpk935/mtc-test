import { requireAdmin } from '@/lib/auth';
import '@/features/reports/components/report-print.css';

export default async function PrintReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
