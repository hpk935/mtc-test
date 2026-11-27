import {
    BarChart3,
    CalendarClock,
    ClipboardList,
    Container,
    FileText,
    LayoutDashboard,
    MapPinned,
    Package,
    Settings,
    ShoppingCart,
    Truck,
    UserCog,
    Users,
    type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/features/users/constants';

/**
 * A page under a nav item, e.g. one report under Reports. The sidebar
 * doesn't list these; they name the page in the header breadcrumb.
 */
export type NavChild = {
    title: string;
    url: string;
};

export type NavItem = {
    title: string;
    url: string;
    icon: LucideIcon;
    /** Users without this permission don't see the item (admins always do). */
    perm?: Permission;
    /** Only admins see the item, whatever their permissions. */
    adminOnly?: boolean;
    children?: NavChild[];
};

export type NavSection = {
    /** Heading above the section. The top section has none. */
    label?: string;
    /** Folds the section away unless the current page is in it. */
    collapsible?: boolean;
    /** Icon for a collapsible section's toggle row. */
    icon?: LucideIcon;
    items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
    {
        items: [{ title: 'Dashboard', url: '/', icon: LayoutDashboard }],
    },
    {
        label: 'Sales',
        items: [
            {
                title: 'Orders',
                url: '/orders',
                icon: ShoppingCart,
                perm: 'orders:view',
            },
            {
                title: 'Invoices',
                url: '/invoices',
                icon: FileText,
                perm: 'invoices:view',
            },
            {
                title: 'Customers',
                url: '/customers',
                icon: Users,
                perm: 'customers:view',
            },
        ],
    },
    {
        label: 'Purchasing',
        items: [
            {
                title: 'Purchase Orders',
                url: '/purchase-orders',
                icon: ClipboardList,
                perm: 'vendors:view',
            },
            {
                title: 'Vendors',
                url: '/vendors',
                icon: Truck,
                perm: 'vendors:view',
            },
        ],
    },
    {
        label: 'Inventory',
        items: [
            {
                title: 'Products',
                url: '/products',
                icon: Package,
                perm: 'products:view',
            },
        ],
    },
    {
        label: 'Insights',
        items: [
            {
                title: 'Reports',
                url: '/reports',
                icon: BarChart3,
                perm: 'reports:view',
                children: [
                    {
                        title: 'Customer Listing',
                        url: '/reports/customers/customer-listing',
                    },
                    {
                        title: 'Invoice Summary',
                        url: '/reports/customers/customer-invoices',
                    },
                    {
                        title: 'Purchase History',
                        url: '/reports/customers/customer-purchases',
                    },
                    {
                        title: 'Sales & Aging',
                        url: '/reports/customers/aging-summary',
                    },
                    {
                        title: 'Aging by Salesperson',
                        url: '/reports/sales/aging-by-salesperson',
                    },
                    {
                        title: 'Inventory Status',
                        url: '/reports/products/inventory-status',
                    },
                    {
                        title: 'Item Invoice History',
                        url: '/reports/products/item-invoice-history',
                    },
                ],
            },
        ],
    },
    {
        label: 'Settings',
        collapsible: true,
        icon: Settings,
        items: [
            {
                title: 'Users',
                url: '/users',
                icon: UserCog,
                perm: 'users:view',
            },
            {
                title: 'Payment Terms',
                url: '/payment-terms',
                icon: CalendarClock,
                adminOnly: true,
            },
            {
                title: 'Territories',
                url: '/territories',
                icon: MapPinned,
                adminOnly: true,
            },
            {
                title: 'Freight Terms',
                url: '/freight-terms',
                icon: Container,
                adminOnly: true,
            },
        ],
    },
];

/** The nav sections this user may see, dropping sections left empty. */
export function visibleNavSections(
    isAdmin: boolean,
    permissions: string[],
): NavSection[] {
    const canSee = (item: NavItem) => {
        if (isAdmin) return true;
        if (item.adminOnly) return false;
        return !item.perm || permissions.includes(item.perm);
    };
    return NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(canSee),
    })).filter((section) => section.items.length > 0);
}

function isUnder(pathname: string, url: string) {
    if (url === '/') return pathname === '/';
    return pathname === url || pathname.startsWith(`${url}/`);
}

export type ActiveNav = {
    section: NavSection;
    item: NavItem;
    child?: NavChild;
};

/**
 * The nav entry the current page belongs to: detail, edit and new pages
 * belong to their list page, and each report to its entry under Reports.
 */
export function findActiveNav(
    pathname: string,
    sections: NavSection[],
): ActiveNav | null {
    for (const section of sections) {
        for (const item of section.items) {
            if (!isUnder(pathname, item.url)) continue;
            const child = item.children?.find((c) => isUnder(pathname, c.url));
            return { section, item, child };
        }
    }
    return null;
}

export type Crumb = { label: string; href?: string };

function segmentLabel(segment: string) {
    if (segment === 'new') return 'New';
    if (segment === 'edit') return 'Edit';
    return decodeURIComponent(segment);
}

/**
 * Header trail for the current page, e.g. Sales › Orders › 1042 › Edit.
 * Every step links back up except the area heading and the current page.
 */
export function navBreadcrumb(
    pathname: string,
    sections: NavSection[],
): Crumb[] {
    const active = findActiveNav(pathname, sections);
    if (!active) return [];

    const steps: { label: string; href: string }[] = [
        { label: active.item.title, href: active.item.url },
    ];
    if (active.child) {
        steps.push({ label: active.child.title, href: active.child.url });
    }
    let href = steps[steps.length - 1].href;
    for (const segment of pathname
        .slice(href.length)
        .split('/')
        .filter(Boolean)) {
        href = `${href}/${segment}`;
        steps.push({ label: segmentLabel(segment), href });
    }

    const crumbs: Crumb[] = active.section.label
        ? [{ label: active.section.label }]
        : [];
    steps.forEach((step, i) =>
        crumbs.push(i === steps.length - 1 ? { label: step.label } : step),
    );
    return crumbs;
}
