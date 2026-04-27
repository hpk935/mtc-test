'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DatePicker } from '@/components/ui/date-picker';

interface ReportDateInputProps {
  paramName: string;
  label: string;
  defaultValue?: string;
  className?: string;
}

export function ReportDateInput({
  paramName,
  label,
  defaultValue,
  className,
}: ReportDateInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramName) ?? defaultValue ?? '';

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(paramName, value);
    } else {
      params.delete(paramName);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={className}>
      <label className="text-muted-foreground mb-1 block text-xs font-medium">
        {label}
      </label>
      <DatePicker value={current} onChange={handleChange} aria-label={label} />
    </div>
  );
}
