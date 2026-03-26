import {
  getDashboardStats,
  getRecentOrders,
  getRecentInvoices,
} from '@/features/dashboard/queries';
import { DashboardSearch } from '@/features/dashboard/components/dashboard-search';
import { QuickActions } from '@/features/dashboard/components/quick-actions';
import { StatsCards } from '@/features/dashboard/components/stats-cards';
import {
  RecentOrders,
  RecentInvoices,
} from '@/features/dashboard/components/recent-activity';
export default async function DashboardPage() {
  const [stats, recentOrders, recentInvoices] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(),
    getRecentInvoices(),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-10 pt-28 pb-16">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            MTC Trading
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Overview of your business at a glance.
          </p>
        </div>

        <DashboardSearch />
      </div>

      <div className="pt-2">
        <QuickActions />
      </div>

      <StatsCards
        totalOrders={stats.totalOrders}
        pendingInvoices={stats.pendingInvoices}
        totalCustomers={stats.totalCustomers}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentOrders orders={recentOrders} />
        <RecentInvoices invoices={recentInvoices} />
      </div>
    </div>
  );
}
