'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  findActiveNav,
  type ActiveNav,
  type NavItem,
  type NavSection,
} from '@/lib/nav';

export function NavMain({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const active = findActiveNav(pathname, sections);

  return sections.map((section, i) => (
    <div key={section.label ?? 'home'}>
      {i > 0 && <SidebarSeparator className="mx-0" />}
      <NavGroup section={section} active={active} />
    </div>
  ));
}

function NavGroup({
  section,
  active,
}: {
  section: NavSection;
  active: ActiveNav | null;
}) {
  const menu = (
    <SidebarMenu>
      {section.items.map((item) => (
        <NavMenuItem key={item.url} item={item} active={active} />
      ))}
    </SidebarMenu>
  );

  // A full-size row (icon, label, chevron) that unfolds the section's pages.
  if (section.collapsible) {
    const isInside = active?.section.label === section.label;
    return (
      <Collapsible defaultOpen={isInside} className="group/section">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={section.label}
                  className={isInside ? 'font-medium' : undefined}>
                  {section.icon && <section.icon />}
                  <span>{section.label}</span>
                  <ChevronRight className="text-muted-foreground ml-auto transition-transform group-data-[state=open]/section:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
            </SidebarMenuItem>
          </SidebarMenu>
          <CollapsibleContent className="pt-1">{menu}</CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  }

  return (
    <SidebarGroup>
      {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
      {menu}
    </SidebarGroup>
  );
}

function NavMenuItem({
  item,
  active,
}: {
  item: NavItem;
  active: ActiveNav | null;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active?.item.url === item.url}
        tooltip={item.title}>
        <Link href={item.url} onClick={closeOnMobile}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
