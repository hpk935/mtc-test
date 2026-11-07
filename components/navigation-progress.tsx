'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { Loader2 } from 'lucide-react';
import {
  navigationKindForClick,
  navigationProgress,
} from '@/lib/navigation-progress';

// A navigation that never lands (network error, cancelled) must not leave the
// indicator up for good.
const GIVE_UP_AFTER_MS = 15_000;

/**
 * Shows that the app is loading after the user clicks something:
 * - a thin progress bar across the top for every navigation;
 * - a spinner over the content area when going to a different page.
 *
 * Render inside a `relative` container (the dashboard's <main>), so the
 * spinner covers the content but not the sidebar or header.
 */
export function NavigationProgress() {
  const pending = useSyncExternalStore(
    navigationProgress.subscribe,
    navigationProgress.getSnapshot,
    () => null,
  );
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlKey = `${pathname}?${searchParams.toString()}`;

  // Link clicks. Listen in the capture phase: next/link cancels the native
  // click in its own handler, so by the bubble phase every in-app link click
  // looks already handled.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const anchor =
        event.target instanceof Element
          ? event.target.closest('a[href]')
          : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const kind = navigationKindForClick(
        event,
        {
          href: anchor.href,
          target: anchor.target,
          download: anchor.hasAttribute('download'),
        },
        window.location.href,
      );
      if (kind) navigationProgress.start(kind);
    }

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // The URL only changes once the new page has rendered, so that's the end.
  useEffect(() => {
    navigationProgress.finish();
  }, [urlKey]);

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(navigationProgress.finish, GIVE_UP_AFTER_MS);
    return () => clearTimeout(timer);
  }, [pending]);

  if (!pending) return null;

  return (
    <>
      <div
        role="progressbar"
        aria-label="Loading"
        className="animate-nav-appear bg-primary/15 pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
        <div className="animate-nav-slide bg-primary h-full w-1/3 motion-reduce:w-full motion-reduce:animate-none" />
      </div>
      {pending === 'page' && (
        <div
          role="status"
          className="animate-nav-appear bg-background/60 pointer-events-none absolute inset-0 z-40 flex justify-center">
          <div className="bg-background text-muted-foreground sticky top-[35vh] mt-[20vh] flex h-fit items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm">
            <Loader2 className="text-primary size-4 animate-spin" />
            Loading…
          </div>
        </div>
      )}
    </>
  );
}
