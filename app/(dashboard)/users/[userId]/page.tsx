import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdmin } from '@/lib/auth';
import { findUserById } from '@/features/users/queries';
import { UserDetailView } from '@/features/users/components/user-detail';
import { UserActions } from '@/features/users/components/user-actions';
import { ResetPasswordForm } from '@/features/users/components/reset-password-form';

export default async function UserDetailPage({
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
    <div className="flex w-full flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/users">
          <ArrowLeft className="mr-2 size-4" />
          Back to Users
        </Link>
      </Button>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {user.employeeId} &middot; {user.email}
          </p>
        </div>
        <UserActions userId={user.id} isActive={user.isActive} />
      </div>
      <UserDetailView
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
      <Card>
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
