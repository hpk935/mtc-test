import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: ReactNode;
  hint?: string;
}

export function ReportStats({
  items,
  className,
}: {
  items: StatItem[];
  className?: string;
}) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {item.label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            {item.value}
          </p>
          {item.hint && (
            <p className="text-muted-foreground mt-1 text-xs">{item.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
}
