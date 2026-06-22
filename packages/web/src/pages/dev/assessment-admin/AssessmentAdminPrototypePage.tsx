import { PrototypeShell } from './PrototypeShell';
import { PrototypeStoreProvider } from './PrototypeStore';

/**
 * Throwaway UX prototype for the assessment-admin authoring surface (Track 3).
 *
 * Clickable, mock-backed exploration of the five authoring areas — flow list,
 * flow builder, question bank, template-question assignment and scoring config.
 * Internal state-based navigation keeps it to a single dev route. No DB, no API,
 * no @ffp/core repositories. The real admin UI is built properly later.
 */
export const AssessmentAdminPrototypePage = (): JSX.Element => (
  <PrototypeStoreProvider>
    <PrototypeShell />
  </PrototypeStoreProvider>
);
