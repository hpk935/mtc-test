'use client';

import { useCallback, useState } from 'react';
import { LoginForm } from '@/features/auth/components/login-form';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'change-password'>('login');

  const handleBack = useCallback(() => setView('login'), []);

  if (view === 'change-password') {
    return <ChangePasswordForm onBack={handleBack} />;
  }

  return <LoginForm onChangePassword={() => setView('change-password')} />;
}
