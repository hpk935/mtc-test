'use client';

import { useAppRouter } from '@/hooks/use-app-router';
import type { ComponentProps, MouseEvent } from 'react';
import { TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const INTERACTIVE =
  'a, button, input, select, textarea, label, [role="button"], [role="checkbox"], [data-no-row-click]';

interface ClickableRowProps extends ComponentProps<typeof TableRow> {
  /** Where clicking anywhere on the row goes. */
  href: string;
}

/**
 * A table row that navigates to `href` when any non-interactive part of it is
 * clicked. Links and buttons inside the row keep their own behavior, and
 * Ctrl/Cmd/middle-click opens the row in a new tab. Keep a real <Link> to the
 * same `href` in the row so keyboard and screen-reader users can reach it.
 */
export function ClickableRow({
  href,
  className,
  onClick,
  onAuxClick,
  ...props
}: ClickableRowProps) {
  const router = useAppRouter();

  function shouldIgnore(e: MouseEvent<HTMLTableRowElement>) {
    if (e.defaultPrevented) return true;
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return true;
    // Don't navigate when the user is selecting text to copy it.
    if (window.getSelection()?.toString()) return true;
    return false;
  }

  function handleClick(e: MouseEvent<HTMLTableRowElement>) {
    onClick?.(e);
    if (e.button !== 0 || shouldIgnore(e)) return;
    if (e.metaKey || e.ctrlKey) {
      window.open(href, '_blank', 'noopener');
      return;
    }
    router.push(href);
  }

  function handleAuxClick(e: MouseEvent<HTMLTableRowElement>) {
    onAuxClick?.(e);
    if (e.button !== 1 || shouldIgnore(e)) return;
    window.open(href, '_blank', 'noopener');
  }

  return (
    <TableRow
      className={cn('group cursor-pointer', className)}
      onClick={handleClick}
      onAuxClick={handleAuxClick}
      onMouseEnter={() => router.prefetch(href)}
      {...props}
    />
  );
}
