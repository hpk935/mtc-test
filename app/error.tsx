'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted">{error.message}</p>
      <button
        onClick={reset}
        className="bg-foreground text-background rounded px-4 py-2 text-sm">
        Try again
      </button>
    </div>
  );
}
