'use server';

import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { users } from '@/features/users/schema';
import { findUserByEmail } from '@/features/users/queries';
import { getNextEmployeeId } from '@/features/users/queries';
import type { ActionResult } from '@/types';
import { hashPassword, verifyPassword, createToken, setSessionCookie, deleteSessionCookie } from './service';
import { loginSchema, registerSchema } from './validation';

export async function login(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const { email, password } = parsed.data;
  const user = await findUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }

  if (!user.isActive) {
    return { success: false, error: 'Your account has been deactivated.' };
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const token = await createToken({
    userId: user.id,
    employeeId: user.employeeId,
    email: user.email,
    role: user.role as 'admin' | 'employee',
  });

  await setSessionCookie(token);
  redirect('/');
}

export async function register(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: 'Please check all fields and try again.' };
  }

  const { email, password, firstName, lastName, role } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return { success: false, error: 'A user with this email already exists.' };
  }

  const passwordHash = await hashPassword(password);
  const employeeId = await getNextEmployeeId();

  await db.insert(users).values({
    employeeId,
    email,
    passwordHash,
    firstName,
    lastName,
    role,
  });

  return { success: true, data: undefined };
}

export async function logout(): Promise<void> {
  await deleteSessionCookie();
  redirect('/login');
}
