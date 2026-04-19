import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_LABEL, PERMISSIONS } from '../constants';
import type { Permission } from '../constants';
import type { UserListItem } from '../queries';

interface UserDetailViewProps {
  user: UserListItem;
}

function formatPermissionLabel(perm: Permission): string {
  const [module, action] = perm.split(':');
  return `${module.charAt(0).toUpperCase() + module.slice(1)}: ${action.charAt(0).toUpperCase() + action.slice(1)}`;
}

export function UserDetailView({ user }: UserDetailViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employee ID</span>
              <span className="font-mono font-medium">{user.employeeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>
                {user.firstName} {user.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="info">{ROLE_LABEL[user.role]}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={user.isActive ? 'success' : 'destructive'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            {user.permissions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No permissions assigned.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.permissions.map((perm) => (
                  <Badge key={perm} variant="secondary">
                    {formatPermissionLabel(perm as Permission)}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
