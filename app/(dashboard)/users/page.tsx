import { requireAdmin } from '@/lib/auth';
import { getAllUsers } from '@/features/users/queries';
import { UsersHeader } from '@/features/users/components/users-header';
import { UserTable } from '@/features/users/components/user-table';
import { DataTableFilter } from '@/components/data/data-table-filter';

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireAdmin();
  const { status } = await searchParams;

  const isActive =
    status === 'active' ? true : status === 'inactive' ? false : undefined;
  const users = await getAllUsers(isActive);

  return (
    <div className="flex w-full flex-col gap-6">
      <UsersHeader isAdmin={session.role === 'admin'} />
      <div className="flex items-center gap-3">
        <DataTableFilter
          options={statusOptions}
          paramName="status"
          defaultValue="active"
          allLabel="All"
        />
      </div>
      <div className="rounded-lg border">
        <UserTable users={users} />
      </div>
    </div>
  );
}
