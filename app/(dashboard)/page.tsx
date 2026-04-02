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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
export default async function DashboardPage() {
  const [stats, recentOrders, recentInvoices] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(),
    getRecentInvoices(),
  ]);

  return (
    <div className="space-y-8">
      <Card className="overflow-visible py-8">
        <CardHeader className="items-center text-center">
          <CardTitle className="font-heading text-3xl font-bold tracking-tight">
            MTC Trading
          </CardTitle>
          <CardDescription className="text-sm">
            Overview of your business at a glance.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <DashboardSearch />
        </CardContent>
      </Card>

      <div>
        <QuickActions />
      </div>

      <StatsCards
        openOrders={stats.openOrders}
        invoicedCount={stats.invoicedCount}
        totalCustomers={stats.totalCustomers}
        totalProducts={stats.totalProducts}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentOrders orders={recentOrders} />
        <RecentInvoices invoices={recentInvoices} />
      </div>
    </div>
  );
}
