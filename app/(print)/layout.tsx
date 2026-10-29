import { requireAuth } from '@/lib/auth';

export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  // Print previews always render light so the on-screen page matches paper,
  // regardless of the user's dashboard theme.
  return (
    <div className="theme-light bg-background text-foreground min-h-screen">
      {children}
    </div>
  );
}
