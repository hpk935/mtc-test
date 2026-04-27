'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetUserPassword } from '../actions';
import type { ActionResult } from '@/types';

interface ResetPasswordFormProps {
  userId: number;
}

export function ResetPasswordForm({ userId }: ResetPasswordFormProps) {
  const action = resetUserPassword.bind(null, userId);
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
    error: '',
  } as ActionResult);

  useEffect(() => {
    if (state && !state.success && state.error) {
      toast.error(state.error);
    }
    if (state?.success) {
      toast.success('Password has been reset.');
    }
  }, [state]);

  return (
    <form action={formAction} className="flex items-end gap-3">
      <div className="flex-1 space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={8}
          maxLength={128}
          placeholder="Minimum 8 characters"
          required
        />
      </div>
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? 'Resetting...' : 'Reset Password'}
      </Button>
    </form>
  );
}
