/** Form values for editing programme template metadata */
export interface TemplateMetadataFormValues {
  /** Display name */
  name: string;
  /** Unique slug for referencing in scoring config */
  slug: string;
  /** Optional description */
  description: string;
  /** Difficulty level */
  difficulty: string;
  /** Whether the template is active ('true' or 'false' for select compatibility) */
  isActive: string;
}
