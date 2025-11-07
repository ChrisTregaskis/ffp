-- Add 'platform' to tenant_type enum for super admin tenants
ALTER TYPE "public"."tenant_type" ADD VALUE 'platform';
