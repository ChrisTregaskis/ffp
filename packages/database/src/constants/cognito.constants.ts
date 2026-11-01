/**
 * Cognito custom attribute mappings
 *
 * Cognito attributes are immutable once created — they cannot be renamed or deleted.
 * The actual attribute names remain custom:tenantId and custom:customerId, but code
 * uses ORGANISATION_ID and LOCATION_ID aliases for clarity.
 */
export const COGNITO_CUSTOM_ATTRIBUTES = {
  /** Maps to custom:tenantId in Cognito (immutable attribute name) */
  ORGANISATION_ID: 'custom:tenantId',
  /** Maps to custom:customerId in Cognito (immutable attribute name) */
  LOCATION_ID: 'custom:customerId',
  ROLE: 'custom:role',
} as const;
