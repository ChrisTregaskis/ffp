import { ne } from 'drizzle-orm';

import { programmes } from '@ffp/database/schema';

/**
 * A member's current programme is their latest one not archived, so a paused programme still
 * counts. Callers pair this with newest-first ordering and a limit of one. The Users list and the programme reads share this; session and exercise writes keep
 * their own active-or-completed lookup, because a paused programme should not take new activity.
 */
export const isCurrentProgramme = ne(programmes.status, 'archived');
