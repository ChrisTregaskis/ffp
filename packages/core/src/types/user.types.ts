import { type UserRoleType } from '../lib';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRoleType;
  customerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = User['role'];
