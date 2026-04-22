'use client';

import { Columns3 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ReportColumn } from './report-columns';

interface ReportColumnsFilterProps {
  columns: ReportColumn[];
  /** URL param name. Defaults to `cols`. */
  paramName?: string;
  label?: string;
}

/**
 * URL-driven column visibility dropdown. Writes a comma-separated list of
 * visible column keys to the `cols` search param. Required columns are always
 * included. When no param is present, all columns are shown.
 */
export function ReportColumnsFilter({
  columns,
  paramName = 'cols',
  label = 'Columns',
}: ReportColumnsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get(paramName);
  const selected = raw
    ? new Set(
        raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      )
    : null;

  const optional = columns.filter((c) => !c.required);
  const isVisible = (key: string, required?: boolean) => {
    if (required) return true;
    if (!selected) return true;
    return selected.has(key);
  };

  const visibleCount = columns.filter((c) =>
    isVisible(c.key, c.required),
  ).length;
  const hiddenCount = columns.length - visibleCount;

  function setVisible(key: string, next: boolean) {
    // Start from current visibility of all optional keys
    const nextSet = new Set<string>();
    for (const c of optional) {
      if (isVisible(c.key, c.required)) nextSet.add(c.key);
    }
    if (next) nextSet.add(key);
    else nextSet.delete(key);

    const params = new URLSearchParams(searchParams.toString());
    // If all optional columns are visible, drop the param (default state).
    if (nextSet.size === optional.length) {
      params.delete(paramName);
    } else {
      params.set(paramName, Array.from(nextSet).join(','));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function reset() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramName);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns3 className="mr-2 size-4" />
          {label}
          {hiddenCount > 0 && (
            <span className="bg-muted text-muted-foreground ml-2 rounded px-1.5 py-0.5 text-xs">
              {visibleCount}/{columns.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Toggle columns</span>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={reset}
              className="text-muted-foreground hover:text-foreground text-xs font-normal">
              Reset
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto p-1">
          {columns.map((c) => {
            const checked = isVisible(c.key, c.required);
            return (
              <label
                key={c.key}
                className={`hover:bg-accent flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${
                  c.required ? 'opacity-60' : ''
                }`}>
                <Checkbox
                  checked={checked}
                  disabled={c.required}
                  onCheckedChange={(v) => setVisible(c.key, Boolean(v))}
                />
                <span className="flex-1">{c.label}</span>
                {c.required && (
                  <span className="text-muted-foreground text-[10px] uppercase">
                    required
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
