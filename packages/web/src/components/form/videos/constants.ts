import type { SelectOption } from '@web/components/form/standardForm/FormSelect';

export const MOVEMENT_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Stretch', value: 'stretch' },
  { label: 'Strength', value: 'strength' },
  { label: 'Mobility', value: 'mobility' },
  { label: 'Balance', value: 'balance' },
];

export const DIFFICULTY_OPTIONS: SelectOption[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];
