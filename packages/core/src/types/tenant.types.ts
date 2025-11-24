import { type TenantStatusType, type TenantTypeType } from '../lib';

export interface Tenant {
  id: string;
  name: string;
  type: TenantTypeType;
  ownerUserId: string;
  status: TenantStatusType;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type TenantType = Tenant['type'];
export type TenantStatus = Tenant['status'];
