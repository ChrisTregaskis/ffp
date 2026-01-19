import { createContext } from 'react';

import type { AssessmentContextValue } from './types';

/**
 * Assessment context for managing assessment flow state.
 *
 * Provides state and dispatch function to child components.
 * Default value is null - must be used within AssessmentProvider.
 */
export const AssessmentContext = createContext<AssessmentContextValue | null>(null);
