'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

// next-themes renders an inline <script> that applies the saved theme before
// first paint. That only matters in the server HTML. When React re-renders the
// root layout in the browser (e.g. on a 404), React 19 logs "Encountered a
// script tag" because client-rendered scripts never run. Marking the script as
// a data block on the client silences that; the server copy stays executable.
// The attribute mismatch is covered by the suppressHydrationWarning next-themes
// already sets on the script.
const scriptProps =
  typeof window === 'undefined'
    ? undefined
    : ({ type: 'application/json' } as const);

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider scriptProps={scriptProps} {...props}>
      {children}
    </NextThemesProvider>
  );
}
