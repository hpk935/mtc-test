'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportPrintButtonProps {
  /**
   * The dashboard path of the current report (e.g. `/reports/customers/customer-listing`).
   * The print tab will be opened at the matching `/print` prefix with the same query params.
   */
  path: string;
  label?: string;
}

export function ReportPrintButton({
  path,
  label = 'Print',
}: ReportPrintButtonProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const target = (path ?? pathname).replace(/^\/+/, '');
  const qs = searchParams.toString();
  const href = `/print/${target}${qs ? `?${qs}` : ''}`;

  return (
    <Button variant="outline" size="sm" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <Printer className="mr-2 size-4" />
        {label}
      </a>
    </Button>
  );
}
