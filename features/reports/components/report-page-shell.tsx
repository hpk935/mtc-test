import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface ReportPageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  backHref?: string;
}

export function ReportPageShell({
  title,
  description,
  actions,
  children,
  backHref = '/reports',
}: ReportPageShellProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs">
            <ChevronLeft className="size-3" />
            Back to Reports
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
