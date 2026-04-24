'use client';

import * as React from 'react';
import Link from 'next/link';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  Users,
  Truck,
  ClipboardList,
  BarChart3,
  UserCog,
} from 'lucide-react';
import type { Session } from '@/features/auth/types';
import type { Permission } from '@/features/users/constants';

const NAV_PERMISSION_MAP: Record<string, Permission> = {
  '/orders': 'orders:view',
  '/invoices': 'invoices:view',
  '/products': 'products:view',
  '/customers': 'customers:view',
  '/vendors': 'vendors:view',
  '/purchase-orders': 'vendors:view',
  '/reports': 'reports:view',
  '/users': 'users:view',
};

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Orders', url: '/orders', icon: ShoppingCart },
  { title: 'Invoices', url: '/invoices', icon: FileText },
  { title: 'Products', url: '/products', icon: Package },
  { title: 'Customers', url: '/customers', icon: Users },
  { title: 'Vendors', url: '/vendors', icon: Truck },
  { title: 'Purchase Orders', url: '/purchase-orders', icon: ClipboardList },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Users', url: '/users', icon: UserCog },
];

export function AppSidebar({
  session,
  permissions = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  session: Session | null;
  permissions?: string[];
}) {
  const isAdmin = session?.role === 'admin';
  const visibleItems = navItems.filter((item) => {
    const requiredPerm = NAV_PERMISSION_MAP[item.url];
    if (!requiredPerm) return true; // Dashboard — always visible
    if (isAdmin) return true;
    return permissions.includes(requiredPerm);
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mtc-logo.webp"
                    alt="MTC Trading Co."
                    className="h-auto w-full"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="font-heading truncate font-semibold">
                    MTC Trading Co.
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser session={session} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
