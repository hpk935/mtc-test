/**
 * What kind of in-app navigation going from `from` to `to` is:
 * - 'page': a different page (path changes) — show the full loading state.
 * - 'params': same page, different query (search, filter, pagination) — show
 *   only the subtle progress bar so the page (and any focused input) stays put.
 */
export type NavigationKind = 'page' | 'params';

export function navigationKind(
    to: string,
    from: string,
): NavigationKind | null {
    const current = new URL(from);
    const next = new URL(to, current);
    // Other sites and mailto:/tel: links leave the app (or open another app).
    if (next.origin !== current.origin) return null;
    if (next.pathname !== current.pathname) return 'page';
    // Compare normalized queries: the indicator finishes when
    // `useSearchParams().toString()` changes, so `%32` vs `2` is no change.
    if (normalizedQuery(next) !== normalizedQuery(current)) return 'params';
    return null;
}

function normalizedQuery(url: URL): string {
    return url.searchParams.toString();
}

/** The parts of a click event that decide whether the app handles it. */
export interface ClickInfo {
    button: number;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    defaultPrevented: boolean;
}

/** The parts of an <a> that decide where (and whether) it navigates. */
export interface LinkInfo {
    href: string;
    target: string;
    /** Whether the link has a `download` attribute. */
    download: boolean;
}

/** The navigation a click on `link` starts in this tab, if any. */
export function navigationKindForClick(
    click: ClickInfo,
    link: LinkInfo,
    currentHref: string,
): NavigationKind | null {
    if (click.defaultPrevented || click.button !== 0) return null;
    // Modifier clicks open a new tab/window or download; this tab stays put.
    if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) {
        return null;
    }
    if (link.download) return null;
    if (link.target && link.target !== '_self') return null;
    return navigationKind(link.href, currentHref);
}

/**
 * Which navigation, if any, is in flight. Shaped for `useSyncExternalStore`.
 */
export function createNavigationProgress() {
    let pending: NavigationKind | null = null;
    const listeners = new Set<() => void>();

    function set(next: NavigationKind | null) {
        if (next === pending) return;
        pending = next;
        listeners.forEach((listener) => listener());
    }

    return {
        start(kind: NavigationKind) {
            // A page change in flight still replaces the page, so keep its
            // spinner even if a params update is queued behind it.
            set(pending === 'page' ? 'page' : kind);
        },
        finish() {
            set(null);
        },
        getSnapshot(): NavigationKind | null {
            return pending;
        },
        subscribe(listener: () => void) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}

/** The app-wide instance the loading indicator renders from. */
export const navigationProgress = createNavigationProgress();
