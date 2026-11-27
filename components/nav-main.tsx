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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
  const isActive = active?.item.url === item.url;

  const button = (
    <SidebarMenuButton
      asChild
      isActive={isActive && !active?.child}
      tooltip={item.title}>
      <Link href={item.url} onClick={closeOnMobile}>
        <item.icon />
        <span>{item.title}</span>
      </Link>
    </SidebarMenuButton>
  );

  if (item.children) {
    const groups = [...new Set(item.children.map((c) => c.group))];
    // The row itself links to the item's index page (so it still works when
    // the sidebar is collapsed to icons); only the chevron folds the list.
    return (
      <Collapsible asChild defaultOpen={isActive} className="group/item">
        <SidebarMenuItem>
          {button}
          <CollapsibleTrigger asChild>
            <SidebarMenuAction className="data-[state=open]:rotate-90">
              <ChevronRight />
              <span className="sr-only">Toggle {item.title}</span>
            </SidebarMenuAction>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {groups.map((group) => (
                <li key={group}>
                  <div className="text-muted-foreground px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wider uppercase">
                    {group}
                  </div>
                  <ul className="flex flex-col gap-1">
                    {item.children!
                      .filter((child) => child.group === group)
                      .map((child) => (
                        <SidebarMenuSubItem key={child.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={active?.child?.url === child.url}>
                            <Link href={child.url} onClick={closeOnMobile}>
                              {child.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                  </ul>
                </li>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return <SidebarMenuItem>{button}</SidebarMenuItem>;
}
