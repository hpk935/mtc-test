export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar — replace with src/components/layout/sidebar.tsx */}
      <aside className="border-border bg-surface w-64 border-r p-4">
        <nav className="space-y-1">
          <p className="text-muted text-sm font-medium">Navigation</p>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        {/* Header — replace with src/components/layout/header.tsx */}
        <header className="border-border bg-surface border-b px-6 py-4">
          <p className="text-muted text-sm">Header</p>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
