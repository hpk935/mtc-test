import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShoppingCart, FileText, Package, Users } from 'lucide-react';

const stats = [
  {
    label: 'Total Orders',
    value: '—',
    icon: ShoppingCart,
    description: 'All time',
  },
  {
    label: 'Pending Invoices',
    value: '—',
    icon: FileText,
    description: 'Awaiting payment',
  },
  {
    label: 'Products',
    value: '—',
    icon: Package,
    description: 'Active catalog',
  },
  { label: 'Customers', value: '—', icon: Users, description: 'Registered' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Overview of your business at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription className="text-xs">
                {stat.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No orders yet.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Latest invoices will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No invoices yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
