/**
 * Mock user roster for the prototype — a faithful stand-in for the real admin
 * Users table (which defaults its role filter to Programme User).
 *
 * The shape mirrors the live `UserListResponse` (id, publicId, email, first/last
 * name, role, location, createdAt). The `programme` summary is the *iteration*:
 * today the users table surfaces no programme data, so for Programme Users we add
 * the active programme's name, status and level (level comes from the template in
 * the real model), plus the assessment result the programme was built from.
 * Throwaway, no DB.
 */
import { type Level } from './prototype-level-model';
import { type FocusId, type GoalId } from './prototype-programmes';

export type UserRole = 'system_admin' | 'customer_owner' | 'customer_admin' | 'programme_user';

export const ROLE_LABELS: Record<UserRole, string> = {
  system_admin: 'System Admin',
  customer_owner: 'Customer Owner',
  customer_admin: 'Customer Admin',
  programme_user: 'Programme User',
};

export type ProgrammeStatus = 'active' | 'paused' | 'completed' | 'archived';

export const PROGRAMME_STATUS_LABELS: Record<ProgrammeStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

/** The active programme a member is on — what the iterated table surfaces for Programme Users. */
export interface MemberProgrammeSummary {
  name: string;
  status: ProgrammeStatus;
  /** Derived from the programme template in the real model. */
  level: Level;
  /** The assessment result the programme was assembled from. */
  goalId: GoalId;
  focusIds: FocusId[];
  startedAt: string;
}

export interface PrototypeUser {
  id: string;
  publicId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  locationId: string | null;
  locationName: string | null;
  createdAt: string;
  /** Null for non-programme users; populated for Programme Users (the iteration). */
  programme: MemberProgrammeSummary | null;
}

export const USERS: PrototypeUser[] = [
  {
    id: 'usr-priya',
    publicId: 'upriya000001',
    email: 'priya.shah@example.com',
    firstName: 'Priya',
    lastName: 'Shah',
    role: 'programme_user',
    locationId: 'loc-1',
    locationName: 'London HQ',
    createdAt: '2026-05-30T09:00:00.000Z',
    programme: {
      name: 'Gentle Mobility — 12 weeks',
      status: 'active',
      level: 1,
      goalId: 'relieve',
      focusIds: ['neck_shoulders', 'back_core'],
      startedAt: '12 Jun 2026',
    },
  },
  {
    id: 'usr-marcus',
    publicId: 'umarcus00001',
    email: 'marcus.bell@example.com',
    firstName: 'Marcus',
    lastName: 'Bell',
    role: 'programme_user',
    locationId: 'loc-1',
    locationName: 'London HQ',
    createdAt: '2026-06-01T09:00:00.000Z',
    programme: {
      name: 'Energised / Dynamic — 12 weeks',
      status: 'active',
      level: 3,
      goalId: 'energy',
      focusIds: ['full_body'],
      startedAt: '18 Jun 2026',
    },
  },
  {
    id: 'usr-sam',
    publicId: 'usam00000001',
    email: 'sam.okafor@example.com',
    firstName: 'Sam',
    lastName: 'Okafor',
    role: 'programme_user',
    locationId: 'loc-2',
    locationName: 'Manchester',
    createdAt: '2026-06-03T09:00:00.000Z',
    programme: {
      name: 'Active Wellness — 12 weeks',
      status: 'active',
      level: 2,
      goalId: 'strength',
      focusIds: ['back_core', 'hips_lower'],
      startedAt: '21 Jun 2026',
    },
  },
  {
    id: 'usr-dana',
    publicId: 'udana0000001',
    email: 'dana.wright@example.com',
    firstName: 'Dana',
    lastName: 'Wright',
    role: 'programme_user',
    locationId: 'loc-2',
    locationName: 'Manchester',
    createdAt: '2026-06-05T09:00:00.000Z',
    programme: {
      name: 'Active Wellness — 12 weeks',
      status: 'paused',
      level: 2,
      goalId: 'relieve',
      focusIds: ['hips_lower'],
      startedAt: '24 Jun 2026',
    },
  },
  {
    id: 'usr-alex',
    publicId: 'ualex0000001',
    email: 'alex.turner@example.com',
    firstName: 'Alex',
    lastName: 'Turner',
    role: 'programme_user',
    locationId: 'loc-1',
    locationName: 'London HQ',
    createdAt: '2026-06-08T09:00:00.000Z',
    programme: {
      name: 'Energised / Dynamic — 12 weeks',
      status: 'active',
      level: 3,
      goalId: 'strength',
      focusIds: ['full_body', 'hips_lower'],
      startedAt: '26 Jun 2026',
    },
  },
  {
    id: 'usr-jordan',
    publicId: 'ujordan00001',
    email: 'jordan.lee@example.com',
    firstName: 'Jordan',
    lastName: 'Lee',
    role: 'programme_user',
    locationId: 'loc-3',
    locationName: 'Bristol',
    createdAt: '2026-04-18T09:00:00.000Z',
    programme: {
      name: 'Gentle Mobility — 12 weeks',
      status: 'completed',
      level: 1,
      goalId: 'relieve',
      focusIds: ['neck_shoulders'],
      startedAt: '02 Feb 2026',
    },
  },
  {
    id: 'usr-erin',
    publicId: 'uerin0000001',
    email: 'erin.davies@example.com',
    firstName: 'Erin',
    lastName: 'Davies',
    role: 'customer_owner',
    locationId: 'loc-1',
    locationName: 'London HQ',
    createdAt: '2026-03-10T09:00:00.000Z',
    programme: null,
  },
  {
    id: 'usr-omar',
    publicId: 'uomar0000001',
    email: 'omar.khan@example.com',
    firstName: 'Omar',
    lastName: 'Khan',
    role: 'customer_admin',
    locationId: 'loc-2',
    locationName: 'Manchester',
    createdAt: '2026-03-15T09:00:00.000Z',
    programme: null,
  },
  {
    id: 'usr-system',
    publicId: 'usystem00001',
    email: 'admin@fitforpurpose.example',
    firstName: 'Robin',
    lastName: 'Carter',
    role: 'system_admin',
    locationId: null,
    locationName: null,
    createdAt: '2026-01-05T09:00:00.000Z',
    programme: null,
  },
];
