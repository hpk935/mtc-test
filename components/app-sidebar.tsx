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
import type { Session } from '@/features/auth/types';
import { visibleNavSections } from '@/lib/nav';

export function AppSidebar({
  session,
  permissions = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  session: Session | null;
  permissions?: string[];
}) {
  const sections = visibleNavSections(
    session?.role === 'admin',
    permissions,
  );

  // Settings sits at the bottom, just above the user card.
  const mainSections = sections.filter((s) => !s.collapsible);
  const pinnedSections = sections.filter((s) => s.collapsible);

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
      <SidebarContent className="gap-0">
        <NavMain sections={mainSections} />
      </SidebarContent>
      <SidebarFooter>
        {pinnedSections.length > 0 && (
          <div className="-mx-2">
            <NavMain sections={pinnedSections} />
          </div>
        )}
        <NavUser session={session} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
