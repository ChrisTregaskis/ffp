import { PrototypeShell } from './PrototypeShell';

/**
 * Throwaway UX prototype for the assessment-admin authoring surface.
 *
 * Clickable, mock-backed exploration of authoring surfaces ahead of their real
 * builds; each screen is removed once the real one ships. A single dev route. No DB, no API,
 * no @ffp/core repositories. The real admin UI is built properly later.
 */
export const AssessmentAdminPrototypePage = (): JSX.Element => <PrototypeShell />;
