/**
 * In-memory store + internal navigation for the assessment-admin prototype.
 * Throwaway: holds the mock member programmes in React state and exposes mutators.
 * No persistence, no network — refresh resets everything.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { PROTOTYPE_HOME_VIEW } from './prototype-nav';
import {
  addExerciseToSession,
  buildProgrammeStructure,
  moveProgrammeExercise,
  moveProgrammeSession,
  removeProgrammeExercise,
  swapProgrammeExercise,
  type MoveDirection,
  type ProgrammePhase,
} from './prototype-programme-structure';
import { USERS } from './prototype-users';

import type { PrototypeView } from './prototype-types';

interface PrototypeStoreValue {
  view: PrototypeView;
  navigate: (view: PrototypeView) => void;

  // Member programme structures (phases → sessions → exercises)
  memberStructures: Record<string, ProgrammePhase[]>;
  swapMemberExercise: (memberId: string, exerciseId: string) => void;
  removeMemberExercise: (memberId: string, exerciseId: string) => void;
  moveMemberExercise: (memberId: string, exerciseId: string, direction: MoveDirection) => void;
  moveMemberSession: (memberId: string, sessionId: string, direction: MoveDirection) => void;
  addMemberExercise: (memberId: string, sessionId: string, videoId: string) => void;
}

/** Seed each programme user's structure from their level — deterministic, built once. */
const seedMemberStructures = (): Record<string, ProgrammePhase[]> => {
  const structures: Record<string, ProgrammePhase[]> = {};

  for (const user of USERS) {
    if (user.programme) {
      structures[user.id] = buildProgrammeStructure(user.programme.level);
    }
  }

  return structures;
};

const PrototypeStoreContext = createContext<PrototypeStoreValue | null>(null);

export const PrototypeStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [memberStructures, setMemberStructures] =
    useState<Record<string, ProgrammePhase[]>>(seedMemberStructures);
  const [view, setView] = useState<PrototypeView>(PROTOTYPE_HOME_VIEW);

  const value = useMemo<PrototypeStoreValue>(() => {
    return {
      view,
      navigate: setView,

      memberStructures,

      swapMemberExercise: (memberId, exerciseId) => {
        const user = USERS.find((item) => item.id === memberId);

        if (!user?.programme) {
          return;
        }

        const { level } = user.programme;
        setMemberStructures((prev) => ({
          ...prev,
          [memberId]: swapProgrammeExercise(prev[memberId] ?? [], exerciseId, level),
        }));
      },

      removeMemberExercise: (memberId, exerciseId) => {
        setMemberStructures((prev) => ({
          ...prev,
          [memberId]: removeProgrammeExercise(prev[memberId] ?? [], exerciseId),
        }));
      },

      moveMemberExercise: (memberId, exerciseId, direction) => {
        setMemberStructures((prev) => ({
          ...prev,
          [memberId]: moveProgrammeExercise(prev[memberId] ?? [], exerciseId, direction),
        }));
      },

      moveMemberSession: (memberId, sessionId, direction) => {
        setMemberStructures((prev) => ({
          ...prev,
          [memberId]: moveProgrammeSession(prev[memberId] ?? [], sessionId, direction),
        }));
      },

      addMemberExercise: (memberId, sessionId, videoId) => {
        setMemberStructures((prev) => ({
          ...prev,
          [memberId]: addExerciseToSession(prev[memberId] ?? [], sessionId, videoId),
        }));
      },
    };
  }, [memberStructures, view]);

  return <PrototypeStoreContext.Provider value={value}>{children}</PrototypeStoreContext.Provider>;
};

// Throwaway prototype: provider + hook co-located for brevity (the real contexts split definitions).
// eslint-disable-next-line react-refresh/only-export-components
export const usePrototypeStore = (): PrototypeStoreValue => {
  const context = useContext(PrototypeStoreContext);

  if (!context) {
    throw new Error('usePrototypeStore must be used within a PrototypeStoreProvider');
  }

  return context;
};
