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
        <div
          key={item.label}
          className="min-w-0 overflow-hidden rounded-lg border p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {item.label}
          </p>
          <p className="mt-1 min-w-0 text-xl leading-tight font-semibold tracking-tight break-words tabular-nums sm:text-2xl">
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
