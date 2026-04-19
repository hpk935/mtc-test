import { requireAdmin } from '@/lib/auth';
import { getAllUsers } from '@/features/users/queries';
import { UsersHeader } from '@/features/users/components/users-header';
import { UserTable } from '@/features/users/components/user-table';

export default async function UsersPage() {
  await requireAdmin();
  const users = await getAllUsers();

  return (
    <div className="flex w-full flex-col gap-6">
      <UsersHeader />
      <div className="rounded-lg border">
        <UserTable users={users} />
      </div>
    </div>
  );
}
