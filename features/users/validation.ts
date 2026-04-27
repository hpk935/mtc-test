import { z } from 'zod/v4';
import { USER_ROLES, PERMISSIONS } from './constants';

const trimmedName = (max: number, label: string) =>
    z
        .string()
        .trim()
        .min(1, `${label} is required`)
        .max(max, `${label} must be ${max} characters or fewer`);

const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .max(255, 'Email must be 255 characters or fewer')
    .pipe(z.email('Invalid email address'));

const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer');

export const createUserSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: trimmedName(100, 'First name'),
    lastName: trimmedName(100, 'Last name'),
    role: z.enum(USER_ROLES).default('employee'),
    permissions: z.array(z.enum(PERMISSIONS)).default([]),
});

export const updateUserSchema = z.object({
    firstName: trimmedName(100, 'First name'),
    lastName: trimmedName(100, 'Last name'),
    email: emailSchema,
    role: z.enum(USER_ROLES),
    permissions: z.array(z.enum(PERMISSIONS)).default([]),
    isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
    password: passwordSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
