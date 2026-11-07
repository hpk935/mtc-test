'use client';

import { useState } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { useAppRouter } from '@/hooks/use-app-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  label?: string;
  paramName?: string;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  label = 'records',
  paramName = 'page',
}: DataTablePaginationProps) {
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, totalCount);

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete(paramName);
    } else {
      params.set(paramName, String(page));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 text-sm">
      <span>
        Showing {showingFrom}–{showingTo} of {totalCount} {label}
      </span>
      <div className="flex items-center gap-2">
        {totalPages > 2 && (
          <GoToPageInput totalPages={totalPages} onGoToPage={goToPage} />
        )}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}>
          <ChevronLeft className="size-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        <span className="text-foreground min-w-[4.5rem] text-center text-sm tabular-nums">
          {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}>
          <ChevronRight className="size-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  );
}

function GoToPageInput({
  totalPages,
  onGoToPage,
}: {
  totalPages: number;
  onGoToPage: (page: number) => void;
}) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const page = Number(value);
    if (page >= 1 && page <= totalPages) {
      onGoToPage(page);
      setValue('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <span className="text-muted-foreground text-sm">Page</span>
      <Input
        type="number"
        min={1}
        max={totalPages}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-full w-full text-center text-sm tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </form>
  );
}
