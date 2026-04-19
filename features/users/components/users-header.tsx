import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UsersHeader({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">
          Manage employee accounts, roles, and permissions.
        </p>
      </div>
      {isAdmin && (
        <Button asChild>
          <Link href="/users/new">
            <Plus className="mr-2 size-4" />
            New User
          </Link>
        </Button>
      )}
    </div>
  );
}
