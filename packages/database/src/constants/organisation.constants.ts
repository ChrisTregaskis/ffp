/**
 * Organisation type values
 *
 * Defines the three types of organisations:
 * - individual: Single user account (physiotherapy client)
 * - business: Organisation with multiple locations (clinics, gyms)
 * - platform: System platform organisation for super admins (internal use only)
 */
export const ORGANISATION_TYPES = ['individual', 'business', 'platform'] as const;

export type OrganisationType = (typeof ORGANISATION_TYPES)[number];

/**
 * Organisation status values
 *
 * Defines the lifecycle states of an organisation:
 * - active: Organisation is active and can access the platform
 * - suspended: Temporarily suspended (e.g., payment issues, policy violation)
 * - inactive: Closed/cancelled organisation (data retained for compliance)
 */
export const ORGANISATION_STATUSES = ['active', 'suspended', 'inactive'] as const;

export type OrganisationStatus = (typeof ORGANISATION_STATUSES)[number];
