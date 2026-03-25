import type { UserRole } from '@/features/users/constants';

export type SessionPayload = {
  userId: number;
  employeeId: string;
  email: string;
  role: UserRole;
};

export type Session = SessionPayload;
