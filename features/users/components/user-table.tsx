import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserListItem } from '../queries';
import { ROLE_LABEL } from '../constants';

const STATUS_VARIANT: Record<string, 'success' | 'destructive'> = {
  true: 'success',
  false: 'destructive',
};

interface UserTableProps {
  users: UserListItem[];
}

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No users found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className="cursor-pointer">
            <TableCell>
              <Link
                href={`/users/${user.id}`}
                className="font-mono font-medium">
                {user.employeeId}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/users/${user.id}`}>
                {user.firstName} {user.lastName}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {user.email}
            </TableCell>
            <TableCell>
              <Badge variant="info">{ROLE_LABEL[user.role]}</Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  STATUS_VARIANT[String(user.isActive)] ?? 'destructive'
                }>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
