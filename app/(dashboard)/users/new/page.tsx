import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserForm } from '@/features/users/components/user-form';

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/users">
          <ArrowLeft className="mr-2 size-4" />
          Back to Users
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New User</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create a new employee account.
        </p>
      </div>
      <UserForm />
    </div>
  );
}
