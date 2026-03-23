export interface UserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  /** Location ID (used in create mode for selection) */
  locationId: string;
  /** Location display name (read-only in edit mode) */
  locationDisplay: string;
  phone: string;
  dateOfBirth: string;
}
