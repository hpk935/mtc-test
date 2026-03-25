import { getSession } from '@/lib/auth';
import { logout } from '@/features/auth/actions';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="border-border bg-surface w-64 border-r p-4">
        <nav className="space-y-1">
          <p className="text-muted text-sm font-medium">Navigation</p>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        <header className="border-border bg-surface flex items-center justify-between border-b px-6 py-4">
          <p className="text-sm">
            {session ? `${session.employeeId} — ${session.email}` : 'Not signed in'}
          </p>
          {session && (
            <form action={logout}>
              <button
                type="submit"
                className="text-muted hover:text-foreground text-sm"
              >
                Sign out
              </button>
            </form>
          )}
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
