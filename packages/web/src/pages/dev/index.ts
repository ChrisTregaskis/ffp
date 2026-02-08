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
    examples: ['Variants', 'Sizes', 'Loading states', 'Icons'],
  },
  {
    title: 'Logo Components',
    description: 'Fit For Purpose brand logos with variants',
    path: `${basePath}/logo`,
    examples: ['Brand blue', 'White', 'Primary dark', 'Sizes', 'Clickable'],
  },
  {
    title: 'Text & Title Components',
    description: 'Text and title variations and elements',
    path: `${basePath}/text`,
    examples: ['h1', 'p', 'weight', 'size'],
  },
  {
    title: 'Loading Spinner Components',
    description: 'Animated loading indicators with customisable sizes and colours',
    path: `${basePath}/loading-spinner`,
    examples: ['Sizes', 'Variants', 'Colours', 'Real-world usage'],
  },
  {
    title: 'Card Components',
    description: 'Contained, elevated surfaces for displaying content',
    path: `${basePath}/card`,
    examples: ['Basic cards', 'Auth cards', 'Profile cards', 'Custom styling'],
  },
  {
    title: 'Motion Animations',
    description: 'Animation library for smooth, performant UI transitions',
    path: `${basePath}/motion`,
    examples: ['Card animations', 'Button clicks', 'Hover effects', 'Spring physics'],
  },
  {
    title: 'Static Alert Components',
    description: 'Contextual alerts for errors, warnings, and success messages',
    path: `${basePath}/static-alert`,
    examples: ['Error alerts', 'Warning alerts', 'Success alerts', 'Dismissible alerts'],
  },
  {
    title: 'Error Boundary',
    description: 'Catch and handle React errors gracefully with fallback UIs',
    path: `${basePath}/error-boundary`,
    examples: ['Basic error catching', 'Custom fallbacks', 'Nested boundaries', 'Best practices'],
  },
  {
    title: 'Assessment Progress',
    description: 'Progress bar for assessment flows with phase labels and step counters',
    path: `${basePath}/assessment-progress`,
    examples: ['Progress states', 'Phase labels', 'Interactive demo', 'Real-world usage'],
  },
  {
    title: 'Assessment Questions',
    description: 'Question renderer components for assessment flows (FFP-139)',
    path: `${basePath}/assessment-questions`,
    examples: ['SingleChoice', 'MultiChoice', 'Numeric', 'Scale', 'Text', 'VideoResponse'],
  },
  {
    title: 'Assessment Screens',
    description: 'Step screen and card components for assessment flows (FFP-140)',
    path: `${basePath}/assessment-screens`,
    examples: ['IntroScreen', 'QuestionCard', 'TransitionCard', 'VideoQuestionCard'],
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
