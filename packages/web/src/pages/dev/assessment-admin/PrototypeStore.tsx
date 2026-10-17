/**
 * In-memory store + internal navigation for the assessment-admin prototype.
 * Throwaway: holds the whole mock catalogue in React state and exposes mutators.
 * No persistence, no network — refresh resets everything.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { INITIAL_FLOWS, INITIAL_QUESTIONS, PROGRAMME_TEMPLATE_OPTIONS } from './prototype-data';
import { PROTOTYPE_ENTRY_FLOW_ID } from './prototype-nav';
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

import type {
  ProgrammeTemplateOption,
  PrototypeFlow,
  PrototypeQuestion,
  PrototypeView,
  ScoringConfig,
} from './prototype-types';

interface PrototypeStoreValue {
  flows: PrototypeFlow[];
  questions: PrototypeQuestion[];
  programmeTemplates: ProgrammeTemplateOption[];

  view: PrototypeView;
  navigate: (view: PrototypeView) => void;

  // Scoring
  updateScoringConfig: (flowId: string, config: ScoringConfig) => void;

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
  const [flows, setFlows] = useState<PrototypeFlow[]>(INITIAL_FLOWS);
  const [questions] = useState<PrototypeQuestion[]>(INITIAL_QUESTIONS);
  const [memberStructures, setMemberStructures] =
    useState<Record<string, ProgrammePhase[]>>(seedMemberStructures);
  const [view, setView] = useState<PrototypeView>({
    name: 'scoring',
    flowId: PROTOTYPE_ENTRY_FLOW_ID,
  });

  const value = useMemo<PrototypeStoreValue>(() => {
    const mutateFlow = (flowId: string, fn: (flow: PrototypeFlow) => PrototypeFlow): void => {
      setFlows((prev) => prev.map((flow) => (flow.id === flowId ? fn(flow) : flow)));
    };

    return {
      flows,
      questions,
      programmeTemplates: PROGRAMME_TEMPLATE_OPTIONS,
      view,
      navigate: setView,

      updateScoringConfig: (flowId, config) => {
        mutateFlow(flowId, (flow) => ({ ...flow, scoringConfig: config }));
      },

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
  }, [flows, questions, memberStructures, view]);

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
