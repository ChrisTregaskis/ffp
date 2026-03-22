/**
 * Location status values
 *
 * Defines the lifecycle states of a location:
 * - active: Location is active and can access the platform
 * - suspended: Temporarily suspended (e.g., payment issues, policy violation)
 * - inactive: Closed/cancelled location (data retained for compliance)
 */
export const LOCATION_STATUSES = ['active', 'suspended', 'inactive'] as const;

export type LocationStatus = (typeof LOCATION_STATUSES)[number];
