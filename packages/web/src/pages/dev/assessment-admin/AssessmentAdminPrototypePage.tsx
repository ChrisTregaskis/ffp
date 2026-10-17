import { PrototypeShell } from './PrototypeShell';
import { PrototypeStoreProvider } from './PrototypeStore';

/**
 * Throwaway UX prototype for the assessment-admin authoring surface.
 *
 * Clickable, mock-backed exploration of authoring surfaces ahead of their real
 * builds; each screen is removed once the real one ships. Internal state-based navigation keeps it to a single dev route. No DB, no API,
 * no @ffp/core repositories. The real admin UI is built properly later.
 */
export const AssessmentAdminPrototypePage = (): JSX.Element => (
  <PrototypeStoreProvider>
    <PrototypeShell />
  </PrototypeStoreProvider>
);
