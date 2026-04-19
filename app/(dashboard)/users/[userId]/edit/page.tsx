import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/auth';
import { findUserById } from '@/features/users/queries';
import { UserForm } from '@/features/users/components/user-form';

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;
  const id = Number(userId);

  if (isNaN(id)) {
    notFound();
  }

  const user = await findUserById(id);
  if (!user) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href={`/users/${id}`}>
          <ArrowLeft className="mr-2 size-4" />
          Back to User
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit {user.firstName} {user.lastName}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {user.employeeId} &middot; {user.email}
        </p>
      </div>
      <UserForm
        user={{
          id: user.id,
          employeeId: user.employeeId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          permissions: (user.permissions ?? []) as string[],
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }}
      />
    </div>
  );
}
