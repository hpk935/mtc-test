import { ShoppingCart, FileText, Package, Users } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface StatsCardsProps {
  totalOrders: number;
  pendingInvoices: number;
  totalCustomers: number;
}

export function StatsCards({
  totalOrders,
  pendingInvoices,
  totalCustomers,
}: StatsCardsProps) {
  const stats = [
    {
      label: 'Total Orders',
      value: totalOrders.toLocaleString(),
      icon: ShoppingCart,
      description: 'All time',
      href: '/orders',
    },
    {
      label: 'Pending Invoices',
      value: pendingInvoices.toLocaleString(),
      icon: FileText,
      description: 'Awaiting payment',
      href: '/invoices',
    },
    {
      label: 'Products',
      value: '—',
      icon: Package,
      description: 'Active catalog',
      href: '/products',
    },
    {
      label: 'Customers',
      value: totalCustomers.toLocaleString(),
      icon: Users,
      description: 'Registered',
      href: '/customers',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Link key={stat.label} href={stat.href} className="group">
          <Card className="group-hover:border-foreground/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription className="text-xs">
                {stat.description}
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
