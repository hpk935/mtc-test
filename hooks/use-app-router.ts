'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { navigationKind, navigationProgress } from '@/lib/navigation-progress';

type AppRouter = ReturnType<typeof useRouter>;

/**
 * `useRouter`, but `push`/`replace` show the app's loading indicator while
 * the new page or results load. Use it for any navigation done in code
 * (row clicks, search boxes, filters); <Link> clicks are tracked already.
 */
export function useAppRouter(): AppRouter {
    const router = useRouter();

    return useMemo(() => {
        function track(href: string) {
            const kind = navigationKind(href, window.location.href);
            if (kind) navigationProgress.start(kind);
        }

        return {
            ...router,
            push(href, options) {
                track(href);
                router.push(href, options);
            },
            replace(href, options) {
                track(href);
                router.replace(href, options);
            },
        };
    }, [router]);
}
