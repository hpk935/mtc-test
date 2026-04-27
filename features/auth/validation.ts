import { z } from 'zod/v4';
import { USER_ROLES } from '@/features/users/constants';

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

export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
});

export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().trim().min(1, 'First name is required').max(100),
    lastName: z.string().trim().min(1, 'Last name is required').max(100),
    role: z.enum(USER_ROLES).default('employee'),
});

export const changePasswordSchema = z.object({
    email: emailSchema,
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
