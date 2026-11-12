'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ChevronsUpDownIcon, LogOutIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { logout } from '@/features/auth/actions';
import type { Session } from '@/features/auth/types';

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export function NavUser({ session }: { session: Session | null }) {
  const { isMobile } = useSidebar();

  if (!session) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="border-sidebar-border bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-14 gap-3 rounded-xl border px-2.5 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent">
              <Avatar className="size-9 rounded-full group-data-[collapsible=icon]:size-8">
                <AvatarFallback className="bg-muted rounded-full text-xs">
                  {getInitials(session.email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{session.email}</span>
                <span className="text-muted-foreground truncate text-xs capitalize">
                  {session.role}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg text-xs">
                    {getInitials(session.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{session.email}</span>
                  <span className="text-muted-foreground truncate text-xs capitalize">
                    {session.role}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {session.employeeId}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action={logout}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full cursor-pointer">
                  <LogOutIcon />
                  Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
