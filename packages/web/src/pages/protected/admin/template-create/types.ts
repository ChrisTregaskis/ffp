/** Form values for creating a new programme template */
export interface CreateTemplateFormValues {
  /** Display name */
  name: string;
  /** Unique slug (auto-generated from name, manually overridable) */
  slug: string;
  /** Optional description */
  description: string;
  /** Difficulty level */
  difficulty: string;
}
