'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  label?: string;
  paramName?: string;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  label = 'records',
  paramName = 'page',
}: DataTablePaginationProps) {
  const router = useRouter();
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

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="text-muted-foreground flex items-center justify-between px-4 py-3 text-sm">
      <span>
        Showing {showingFrom}–{showingTo} of {totalCount} {label}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}>
          <ChevronLeft className="size-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1.5">
              &hellip;
            </span>
          ) : (
            <Button
              key={p}
              variant={p === currentPage ? 'default' : 'outline'}
              size="icon-sm"
              onClick={() => goToPage(p)}
              aria-current={p === currentPage ? 'page' : undefined}
              className={p === currentPage ? 'pointer-events-none' : ''}>
              {p}
            </Button>
          ),
        )}
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
