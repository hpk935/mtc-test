import { z } from 'zod/v4';
import { USER_ROLES, PERMISSIONS } from './constants';

export const createUserSchema = z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(USER_ROLES).default('employee'),
    permissions: z.array(z.enum(PERMISSIONS)).default([]),
});

export const updateUserSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.email('Invalid email address'),
    role: z.enum(USER_ROLES),
    permissions: z.array(z.enum(PERMISSIONS)).default([]),
    isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
