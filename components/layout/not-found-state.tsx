'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, FileQuestion, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotFoundStateProps {
  title: string;
  description: string;
  /** Primary action, usually the list page the missing record belongs to. */
  backHref?: string;
  backLabel?: string;
  /** Fill the viewport. Use outside the dashboard shell. */
  fullScreen?: boolean;
}

export function NotFoundState({
  title,
  description,
  backHref,
  backLabel,
  fullScreen = false,
}: NotFoundStateProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center',
        fullScreen && 'min-h-screen',
      )}>
      <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
        <FileQuestion className="size-7" />
      </div>

      <div className="flex max-w-md flex-col items-center gap-2">
        <p className="text-muted-foreground text-sm font-medium">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
        {pathname && (
          <p className="bg-muted text-muted-foreground mt-1 rounded px-2 py-0.5 font-mono text-xs break-all">
            {pathname}
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {backHref && backLabel && (
          <Button asChild>
            <Link href={backHref}>
              <ArrowLeft />
              {backLabel}
            </Link>
          </Button>
        )}
        <Button variant={backHref ? 'outline' : 'default'} asChild>
          <Link href="/">
            <LayoutDashboard />
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
