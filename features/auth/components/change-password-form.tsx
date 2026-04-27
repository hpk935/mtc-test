'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { changePassword } from '../actions';
import type { ActionResult } from '@/types';

const initialState: ActionResult = { success: false, error: '' };

interface ChangePasswordFormProps {
  onBack: () => void;
}

export function ChangePasswordForm({ onBack }: ChangePasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );

  useEffect(() => {
    if (!state.success && state.error) {
      toast.error(state.error);
    }
    if (state.success) {
      toast.success('Password changed successfully. You can now sign in.');
      onBack();
    }
  }, [state, onBack]);

  // Client preflight: catches identical-password submissions before the
  // server round-trip and shows the same error toast.
  function handleSubmit(formData: FormData) {
    const currentPassword = String(formData.get('currentPassword') ?? '');
    const newPassword = String(formData.get('newPassword') ?? '');
    if (currentPassword && newPassword && currentPassword === newPassword) {
      toast.error('New password must be different from current password.');
      return;
    }
    formAction(formData);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Change Password</CardTitle>
        <CardDescription>
          Enter your email, current password, and a new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@mtc.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-muted-foreground text-xs">
              Minimum 8 characters.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Changing...' : 'Change Password'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onBack}>
            Back to Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
