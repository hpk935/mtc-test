import Link from 'next/link';
import { UserPlus, ShoppingCart, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const actions = [
  {
    label: 'Add New Customer',
    href: '/customers/new',
    icon: UserPlus,
  },
  {
    label: 'Create Order',
    href: '/orders/new',
    icon: ShoppingCart,
  },
  {
    label: 'Add New Vendor',
    href: '/vendors',
    icon: Building2,
  },
];

export function QuickActions({ isAdmin }: { isAdmin: boolean }) {
  if (!isAdmin) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-muted-foreground text-sm font-medium">
        Quick Actions
      </h2>
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <Button key={action.label} variant="outline" asChild>
            <Link href={action.href}>
              <action.icon className="mr-2 size-4" />
              {action.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
