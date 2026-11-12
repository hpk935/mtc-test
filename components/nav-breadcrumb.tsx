'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { NAV_SECTIONS, navBreadcrumb } from '@/lib/nav';

/** Where the current page sits in the nav, e.g. Sales › Orders › 1042. */
export function NavBreadcrumb() {
  const pathname = usePathname();
  const crumbs = navBreadcrumb(pathname, NAV_SECTIONS);
  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, i) => {
          const isFirst = i === 0 && crumbs.length > 1;
          return (
            <Fragment key={i}>
              {i > 0 && (
                <BreadcrumbSeparator
                  className={i === 1 ? 'hidden md:block' : undefined}
                />
              )}
              {/* On narrow screens drop the area heading to save room. */}
              <BreadcrumbItem
                className={isFirst ? 'hidden md:inline-flex' : 'min-w-0'}>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage className="truncate">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href} className="truncate">
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="truncate">{crumb.label}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
