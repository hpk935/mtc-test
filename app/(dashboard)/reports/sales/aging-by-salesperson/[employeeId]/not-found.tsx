import { NotFoundState } from '@/components/layout/not-found-state';

export default function SalespersonNotFound() {
  return (
    <NotFoundState
      title="Salesperson not found"
      description="No salesperson matches this employee ID."
      backHref="/reports/sales/aging-by-salesperson"
      backLabel="Back to Aging by Salesperson"
    />
  );
}
