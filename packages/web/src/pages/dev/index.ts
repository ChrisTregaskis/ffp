import { type ComponentCategory } from '@web/components/dev';

const basePath = '/components';

export const componentCategories: ComponentCategory[] = [
  {
    title: 'Form Components',
    description: 'Input fields, validation, and form utilities',
    path: `${basePath}/form`,
    examples: ['Email input', 'Password input', 'Text input', 'Form validation'],
  },
  {
    title: 'Icon Components',
    description: 'Icon library and usage examples',
    path: `${basePath}/icon`,
    examples: ['Icon grid', 'Icon sizing', 'Icon colours'],
  },
  {
    title: 'Button Components',
    description: 'Buttons, links, and call-to-action elements',
    path: `${basePath}/button`,
    examples: ['Primary button', 'Secondary button', 'Icon button'],
    comingSoon: true,
  },
  {
    title: 'Text Components',
    description: 'Text variations and elements',
    path: `${basePath}/button`,
    examples: ['h1', 'p', 'weight', 'size'],
    comingSoon: true,
  },
  {
    title: 'Modal Components',
    description: 'Dialogs, modals, and overlays',
    path: `${basePath}/modal`,
    examples: ['Alert modal', 'Confirmation modal', 'Form modal'],
    comingSoon: true,
  },
  {
    title: 'Table Components',
    description: 'Data tables, grids, and lists',
    path: `${basePath}/table`,
    examples: ['Basic table', 'Sortable table', 'Paginated table'],
    comingSoon: true,
  },
];
