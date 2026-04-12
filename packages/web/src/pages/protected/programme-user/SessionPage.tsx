import { AnimatePresence } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { ProgrammeDetailResponse } from '@ffp/core';

import { ProgressBar } from '@web/components/ProgressBar';
import {
  ActiveExercisePanel,
  ExerciseSidebar,
  ExitDialog,
  RestTimerBar,
  SessionHeader,
  toSessionExercise,
} from '@web/components/session';
import type { SessionExercise } from '@web/components/session';
import { useToggleExerciseMutation } from '@web/hooks/exercises';
import { useProgrammeDetailQuery } from '@web/hooks/programmes';
import { useCompleteSessionMutation, useStartSessionMutation } from '@web/hooks/sessions';
import { useToast } from '@web/hooks/useToast';

import { SessionPageState } from './SessionPageState';

import type { SessionState } from './SessionPageState';

type Phase = ProgrammeDetailResponse['phases'][number];
type Session = Phase['sessions'][number];

/** Find matching phase and session from programme detail */
const findSessionData = (
  detail: ProgrammeDetailResponse,
  phaseId: string,
  templateSessionId: string
): { phase: Phase; session: Session } | null => {
  for (const phase of detail.phases) {
    if (phase.publicId === phaseId) {
      const session = phase.sessions.find((s) => s.templateSessionPublicId === templateSessionId);

      if (session) {
        return { phase, session };
      }
    }
  }

  return null;
};

/**
 * Full-screen session workout page.
 *
 * Route: /programme/session/:phaseId/:templateSessionId
 * Layout: excludeLayout (no app sidebar). Top bar + exercise sidebar + main panel.
 */
export const SessionPage: React.FC = () => {
  const { phaseId, templateSessionId } = useParams<{
    phaseId: string;
    templateSessionId: string;
  }>();
  const navigate = useNavigate();

  const { data: detail, isLoading: isDetailLoading } = useProgrammeDetailQuery();
  const { addToast } = useToast();
  const startSession = useStartSessionMutation();
  const completeSession = useCompleteSessionMutation();
  const toggleExercise = useToggleExerciseMutation();

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Find session data from programme detail
  const sessionData = useMemo(() => {
    if (!detail || !phaseId || !templateSessionId) {
      return null;
    }

    return findSessionData(detail, phaseId, templateSessionId);
  }, [detail, phaseId, templateSessionId]);

  // Map exercises to flat view model
  const exercises: SessionExercise[] = useMemo(() => {
    if (!sessionData?.session.exercises) {
      return [];
    }

    return sessionData.session.exercises.map(toSessionExercise);
  }, [sessionData]);

  // Session state
  const userSessionId = sessionData?.session.userSession?.id;
  const sessionStatus = sessionData?.session.userSession?.status;
  const needsStart = !userSessionId || sessionStatus === 'not_started';
  const isComplete = sessionStatus === 'completed';

  // Derive page state for clean rendering
  const pageState: SessionState = useMemo(() => {
    if (isDetailLoading) {
      return 'loading';
    }

    if (!sessionData || !phaseId || !templateSessionId) {
      return 'not-found';
    }

    if (needsStart) {
      return 'needs-start';
    }

    if (isComplete) {
      return 'completed';
    }

    if (exercises.length === 0) {
      return 'not-found';
    }

    return 'workout';
  }, [
    isDetailLoading,
    sessionData,
    phaseId,
    templateSessionId,
    needsStart,
    isComplete,
    exercises.length,
  ]);

  // Derived values
  const activeExercise = exercises.at(activeExerciseIndex);
  const completedCount = exercises.filter((e) => e.completed).length;
  const progressPercent = exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;

  // Start session — use resolved UUIDs from sessionData, not publicId URL params
  const handleStartSession = useCallback((): void => {
    if (!sessionData || startSession.isPending) {
      return;
    }

    startSession.mutate({
      programmePhaseId: sessionData.phase.id,
      templateSessionId: sessionData.session.templateSessionId,
    });
  }, [sessionData, startSession]);

  // Advance to next uncompleted exercise
  const advanceToNext = useCallback((): void => {
    const nextIndex = exercises.findIndex((e, idx) => idx > activeExerciseIndex && !e.completed);

    if (nextIndex !== -1) {
      setActiveExerciseIndex(nextIndex);
    }
  }, [exercises, activeExerciseIndex]);

  // Mark exercise complete
  const handleMarkComplete = useCallback((): void => {
    if (toggleExercise.isPending || !activeExercise) {
      return;
    }

    toggleExercise.mutate(
      { completionId: activeExercise.completionId, completed: true },
      {
        onSuccess: (data) => {
          // Cascade feedback toasts
          if (data.cascade.programmeCompleted) {
            addToast('Programme Complete! Congratulations!', { variant: 'success' });
          } else if (data.cascade.phaseCompleted) {
            addToast('Phase Complete!', { variant: 'success' });
          } else if (data.cascade.sessionAutoCompleted) {
            addToast('Session Complete!', { variant: 'success' });
          }

          // Delay advance for breathing room
          setTimeout(() => {
            advanceToNext();
          }, 400);
        },
        onError: () => {
          addToast('Failed to update exercise. Please try again.', { variant: 'error' });
        },
      }
    );
  }, [activeExercise, toggleExercise, advanceToNext, addToast]);

  // Skip exercise (move to next without completing)
  const handleSkip = useCallback((): void => {
    advanceToNext();
  }, [advanceToNext]);

  // Rest timer — toggle on/off, capture seconds so it persists across exercise changes
  const isResting = restSeconds !== null;

  const handleRestToggle = useCallback((): void => {
    if (isResting) {
      setRestSeconds(null);
    } else {
      setRestSeconds(activeExercise?.restSeconds ?? null);
    }
  }, [isResting, activeExercise?.restSeconds]);

  const handleRestComplete = useCallback((): void => {
    setRestSeconds(null);
  }, []);

  // Exit dialog
  const handleExitClick = useCallback((): void => {
    setShowExitDialog(true);
  }, []);

  const handlePause = useCallback((): void => {
    void navigate('/');
  }, [navigate]);

  const handleDone = useCallback((): void => {
    if (userSessionId) {
      completeSession.mutate(userSessionId, {
        onSuccess: () => {
          void navigate('/');
        },
        onError: () => {
          addToast('Failed to complete session. Please try again.', { variant: 'error' });
          setShowExitDialog(false);
        },
      });
    } else {
      void navigate('/');
    }
  }, [userSessionId, completeSession, navigate, addToast]);

  const handleBackToProgramme = useCallback((): void => {
    void navigate('/');
  }, [navigate]);

  // Non-workout states (loading, not found, needs start, completed)
  if (pageState !== 'workout') {
    return (
      <SessionPageState
        state={pageState}
        sessionName={sessionData?.session.name ?? undefined}
        sessionDescription={sessionData?.session.description}
        phaseContext={
          sessionData
            ? `Phase ${String(sessionData.phase.phaseNumber)}: ${sessionData.phase.name ?? ''}`
            : undefined
        }
        exerciseCount={sessionData?.session.exerciseCount ?? 0}
        isStarting={startSession.isPending}
        exercisesCompleted={completedCount}
        estimatedDurationMinutes={sessionData?.session.estimatedDurationMinutes}
        onStart={handleStartSession}
        onBackToProgramme={handleBackToProgramme}
      />
    );
  }

  // Type narrowing guard — pageState logic ensures exercises.length > 0 before reaching here
  if (!activeExercise) {
    return <SessionPageState state="not-found" onBackToProgramme={handleBackToProgramme} />;
  }

  // Workout render — sessionData guaranteed non-null when pageState === 'workout'
  const sessionName = sessionData?.session.name ?? 'Session';

  return (
    <div className="flex h-screen flex-col">
      <SessionHeader
        sessionName={sessionName}
        activeExerciseIndex={activeExerciseIndex}
        totalExercises={exercises.length}
        sidebarOpen={sidebarOpen}
        onExit={handleExitClick}
        onToggleSidebar={() => {
          setSidebarOpen((prev) => !prev);
        }}
      />

      <ProgressBar percent={progressPercent} className="h-1! rounded-none!" />

      {/* Rest timer bar — sits above content, exercises remain visible */}
      <AnimatePresence>
        {restSeconds !== null && (
          <RestTimerBar key={restSeconds} seconds={restSeconds} onComplete={handleRestComplete} />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Exercise sidebar (desktop) */}
        <ExerciseSidebar
          exercises={exercises}
          activeIndex={activeExerciseIndex}
          isOpen={sidebarOpen}
          onExerciseClick={setActiveExerciseIndex}
        />

        {/* Main exercise area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <ActiveExercisePanel
              key={activeExercise.completionId}
              exercise={activeExercise}
              isPending={toggleExercise.isPending}
              isResting={isResting}
              onMarkComplete={handleMarkComplete}
              onSkip={handleSkip}
              onRestToggle={handleRestToggle}
            />
          </AnimatePresence>
        </div>
      </div>

      {/* Exit dialog */}
      <AnimatePresence>
        {showExitDialog && (
          <ExitDialog
            completedCount={completedCount}
            totalCount={exercises.length}
            onPause={handlePause}
            onDone={handleDone}
            onCancel={() => {
              setShowExitDialog(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
