'use client';

import { useActionState, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  USER_ROLES,
  PERMISSIONS,
  ROLE_LABEL,
  DEFAULT_PERMISSIONS,
} from '../constants';
import type { Permission, UserRole } from '../constants';
import type { UserListItem } from '../queries';
import type { ActionResult } from '@/types';
import { createUser, updateUser } from '../actions';

interface UserFormProps {
  user?: UserListItem;
}

const PERMISSION_GROUPS: Record<
  string,
  { label: string; permissions: Permission[] }
> = {
  orders: {
    label: 'Orders',
    permissions: ['orders:view'],
  },
  invoices: {
    label: 'Invoices',
    permissions: ['invoices:view'],
  },
  products: {
    label: 'Products',
    permissions: ['products:view'],
  },
  customers: {
    label: 'Customers',
    permissions: ['customers:view'],
  },
  reports: {
    label: 'Reports',
    permissions: ['reports:view'],
  },
  users: {
    label: 'Users',
    permissions: ['users:view'],
  },
};

function formatPermissionLabel(perm: Permission): string {
  const action = perm.split(':')[1];
  return action.charAt(0).toUpperCase() + action.slice(1);
}

export function UserForm({ user }: UserFormProps) {
  const isEdit = !!user;

  const serverAction = isEdit ? updateUser.bind(null, user.id) : createUser;

  async function actionWithToast(
    _prevState: ActionResult,
    formData: FormData,
  ): Promise<ActionResult> {
    const result = await serverAction(_prevState, formData);
    if (result.success && isEdit) {
      toast.success('User updated successfully.');
    } else if (!result.success && result.error) {
      toast.error(result.error);
    }
    return result;
  }

  const [state, formAction, isPending] = useActionState(actionWithToast, {
    success: false,
    error: '',
  } as ActionResult);

  const defaultPermissions = user?.permissions ?? [];
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(
    new Set(defaultPermissions),
  );

  function getViewPerm(module: string): Permission {
    return `${module}:view` as Permission;
  }

  function togglePermission(perm: Permission, checked: boolean) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(perm);
      } else {
        next.delete(perm);
        // If unchecking a view permission, remove all other perms in that module
        const [module, action] = perm.split(':');
        if (action === 'view') {
          const group = PERMISSION_GROUPS[module];
          if (group) {
            for (const p of group.permissions) {
              next.delete(p);
            }
          }
        }
      }
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={user.employeeId}
                readOnly
                disabled
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={user?.firstName ?? ''}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={user?.lastName ?? ''}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user?.email ?? ''}
              required
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
              />
              <p className="text-muted-foreground text-xs">
                Minimum 8 characters.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role" defaultValue={user?.role ?? 'employee'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABEL[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select name="isActive" defaultValue={String(user.isActive)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
            const viewPerm = getViewPerm(key);
            const hasView = selectedPerms.has(viewPerm);

            return (
              <div key={key}>
                <h4 className="mb-3 text-sm font-medium">{group.label}</h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {group.permissions.map((perm) => {
                    const isView = perm === viewPerm;
                    const disabled = !isView && !hasView;

                    return (
                      <label
                        key={perm}
                        className={`flex items-center gap-2 text-sm ${disabled ? 'text-muted-foreground/50' : ''}`}>
                        <Checkbox
                          name="permissions"
                          value={perm}
                          checked={selectedPerms.has(perm)}
                          disabled={disabled}
                          onCheckedChange={(checked) =>
                            togglePermission(perm, checked === true)
                          }
                        />
                        {formatPermissionLabel(perm)}
                      </label>
                    );
                  })}
                </div>
                <Separator className="mt-4" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit
              ? 'Saving...'
              : 'Creating...'
            : isEdit
              ? 'Save Changes'
              : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
