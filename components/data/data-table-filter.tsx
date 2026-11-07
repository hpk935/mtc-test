'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useAppRouter } from '@/hooks/use-app-router';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTableFilterOption {
  label: string;
  value: string;
}

interface DataTableFilterProps {
  options: DataTableFilterOption[];
  paramName?: string;
  defaultValue?: string;
  allLabel?: string;
}

export function DataTableFilter({
  options,
  paramName = 'status',
  defaultValue,
  allLabel = 'All',
}: DataTableFilterProps) {
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentValue = searchParams.get(paramName) ?? defaultValue ?? 'all';

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, value);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
