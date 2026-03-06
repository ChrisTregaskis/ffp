/**
 * Supported field data types for form fields
 */
export enum FieldDataType {
  STRING = 'String',
  PASSWORD = 'Password',
  NUMBER = 'Number',
  SELECT = 'Select',
  TEXTAREA = 'Textarea',
  TAG_INPUT = 'TagInput',
  CHECKBOX = 'Checkbox',
  /** Assessment Specific */
  PAIN_SCALE = 'PainScale',
  BODY_MAP = 'BodyMap',
  YES_NO = 'YesNo',
  RANGE = 'Range',
}
