'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  FileText,
  Truck,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useSidebar } from './sidebar-context';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Orders', href: '/orders', icon: ShoppingCart },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Vendors', href: '/vendors', icon: Truck },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  // Mobile sidebar is always expanded
  const isCollapsed = mobile ? false : collapsed;

  return (
    <aside
      className={cn(
        'border-border/50 bg-card flex flex-col border-r transition-all duration-200',
        mobile ? 'w-60' : 'hidden md:flex',
        !mobile && (isCollapsed ? 'w-17' : 'w-60'),
      )}>
      <div
        className={cn(
          'flex h-14 items-center',
          isCollapsed ? 'justify-center px-2' : 'px-4',
        )}>
        {isCollapsed ? (
          <span className="font-heading text-lg font-bold">M</span>
        ) : (
          <Link
            href="/"
            className="font-heading text-lg font-bold tracking-tight">
            MTC Internal
          </Link>
        )}
      </div>
      <TooltipProvider delayDuration={0}>
        <nav
          className={cn(
            'flex-1 space-y-1 py-4',
            isCollapsed ? 'px-2' : 'px-3',
          )}>
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center rounded-md text-sm font-medium transition-colors',
                      isCollapsed
                        ? 'justify-center px-2 py-2'
                        : 'gap-3 px-3 py-2',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && item.label}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">{item.label}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>

      {/* Collapse toggle — desktop only */}
      {!mobile && (
        <div
          className={cn(
            'border-border/50 border-t p-2',
            isCollapsed ? 'flex justify-center' : 'flex justify-end',
          )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8">
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
          </Button>
        </div>
      )}
    </aside>
  );
}
