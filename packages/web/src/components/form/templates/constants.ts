import type { SelectOption } from '@web/components/form/standardForm/FormSelect';

export const DIFFICULTY_OPTIONS: SelectOption[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export const STATUS_OPTIONS: SelectOption[] = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];
