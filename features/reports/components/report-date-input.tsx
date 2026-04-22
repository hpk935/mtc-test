'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set(paramName, e.target.value);
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
      <Input type="date" value={current} onChange={handleChange} />
    </div>
  );
}
