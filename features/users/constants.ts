export const USER_ROLES = ['admin', 'employee'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PERMISSIONS = [
    'orders:view',
    'invoices:view',
    'products:view',
    'customers:view',
    'reports:view',
    'users:view',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_LABEL: Record<UserRole, string> = {
    admin: 'Admin',
    employee: 'Employee',
};

/**
 * Default permissions by role.
 * Admins get all permissions. Employees get a basic set.
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
    admin: [...PERMISSIONS],
    employee: ['invoices:view', 'products:view'],
};
