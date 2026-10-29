'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` during server render and hydration, `true` afterwards in the browser.
 *
 * Use it to render values that differ between server and browser, such as the
 * current time in the user's timezone, without a hydration mismatch.
 */
export function useIsClient() {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );
}
