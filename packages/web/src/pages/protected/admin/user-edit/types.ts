export interface UserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  /** Customer ID (used in create mode for selection) */
  customerId: string;
  /** Customer display name (read-only in edit mode) */
  customerDisplay: string;
  phone: string;
  dateOfBirth: string;
}
