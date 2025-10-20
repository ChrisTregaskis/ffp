export const APP_NAME = "FFP - Fitness & Physiotherapy Platform";
export const APP_VERSION = "0.0.1";

export const USER_ROLES = {
  INDIVIDUAL_USER: "individual_user",
  BUSINESS_USER: "business_user",
  BUSINESS_ADMIN: "business_admin",
  COMPANY_ADMIN: "company_admin",
} as const;

export type UserRoleType = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const TENANT_TYPES = {
  INDIVIDUAL: "individual",
  BUSINESS: "business",
  COMPANY: "company",
} as const;

export type TenantTypeType = (typeof TENANT_TYPES)[keyof typeof TENANT_TYPES];

export const TENANT_STATUS = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  TRIAL: "trial",
} as const;

export type TenantStatusType =
  (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];
