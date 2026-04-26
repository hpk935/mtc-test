'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ReportSelectFilterProps {
  paramName: string;
  label: string;
  options: { label: string; value: string }[];
  allLabel?: string;
  defaultValue?: string;
  includeAll?: boolean;
  className?: string;
}

/**
 * URL-driven <Select> filter. Similar to DataTableFilter but with configurable
 * param name and an optional "all" sentinel (sentinel value is empty string;
 * selection simply deletes the param).
 */
export function ReportSelectFilter({
  paramName,
  label,
  options,
  allLabel = 'All',
  defaultValue,
  includeAll = true,
  className,
}: ReportSelectFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current =
    searchParams.get(paramName) ??
    defaultValue ??
    (includeAll ? '__all__' : '');

  const currentLabel =
    current === '__all__'
      ? allLabel
      : (options.find((o) => o.value === current)?.label ?? allLabel);

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === '__all__' || value === '') {
      params.delete(paramName);
    } else {
      params.set(paramName, value);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={cn('min-w-0', className)}>
      <label className="text-muted-foreground mb-1 inline-block w-fit text-xs font-medium">
        {label}
      </label>
      <Select value={current} onValueChange={handleChange}>
        <SelectTrigger className="w-full min-w-0">
          <SelectValue placeholder={currentLabel}>{currentLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {includeAll && <SelectItem value="__all__">{allLabel}</SelectItem>}
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
