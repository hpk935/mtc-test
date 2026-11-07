'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useAppRouter } from '@/hooks/use-app-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReportViewTabsProps {
  paramName?: string;
  options: { label: string; value: string }[];
  defaultValue?: string;
}

/**
 * URL-driven tab switcher, e.g. `view=per-customer|all`.
 */
export function ReportViewTabs({
  paramName = 'view',
  options,
  defaultValue,
}: ReportViewTabsProps) {
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current =
    searchParams.get(paramName) ?? defaultValue ?? options[0]?.value;

  function handleSelect(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, value);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="bg-muted inline-flex rounded-md p-0.5">
      {options.map((opt) => {
        const active = current === opt.value;
        return (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleSelect(opt.value)}
            className={cn(
              'rounded-sm',
              active &&
                'bg-background text-foreground hover:bg-background shadow-sm',
            )}>
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
