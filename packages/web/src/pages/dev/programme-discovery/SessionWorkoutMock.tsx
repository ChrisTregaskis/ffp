import { AnimatePresence, motion } from 'motion/react';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { ClickScale } from '@web/components/motion/ClickScale';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';

import { getCurrentSession, MOCK_VIDEO_URL } from './mock-data';

import type { MockExercise, MockSession } from './mock-data';

/**
 * Discovery prototype: Session Workout Page
 *
 * Full-screen, focused execution mode. The user is guided through exercises
 * one at a time with video, instructions, and set tracking.
 *
 * Key UX principles:
 * - Exercise-first: the current exercise IS the experience
 * - Sidebar is secondary wayfinding, not the primary view
 * - Breathing room between exercises (calm transitions)
 * - Warm, professional micro-interactions
 */

// ─── Prescription Badge ──────────────────────────────────────────────────────

type BadgeVariant = 'blue' | 'purple' | 'green';

const BADGE_COLOURS: Record<BadgeVariant, string> = {
  blue: 'bg-ffp-dark-blue',
  purple: 'bg-ffp-light-purple text-ffp-dark-blue',
  green: 'bg-ffp-green',
};

interface PrescriptionBadgeProps {
  label: string;
  icon: (typeof Icons)[keyof typeof Icons];
  variant?: BadgeVariant;
}

const PrescriptionBadge: React.FC<PrescriptionBadgeProps> = ({ label, icon, variant = 'blue' }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium ${variant === 'purple' ? '' : 'text-white'} ${BADGE_COLOURS[variant]}`}
  >
    <Icon
      name={icon}
      styleProps={{
        size: 'sm',
        colour: variant === 'purple' ? 'var(--color-ffp-dark-blue)' : '#ffffff',
      }}
    />
    {label}
  </span>
);

// ─── Exercise Detail Accordion ───────────────────────────────────────────────

interface ExerciseDetailProps {
  exercise: MockExercise;
}

const ExerciseDetail: React.FC<ExerciseDetailProps> = ({ exercise }) => (
  <div className="space-y-3 rounded-lg bg-muted/30 px-4 py-4">
    <div>
      <Text
        as="p"
        styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
        className="mb-1 uppercase tracking-wide"
      >
        Setup
      </Text>
      <Text as="p" styleProps={{ size: 'sm' }}>
        {exercise.instructions.setup}
      </Text>
    </div>

    <div>
      <Text
        as="p"
        styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
        className="mb-1 uppercase tracking-wide"
      >
        Execution
      </Text>
      <Text as="p" styleProps={{ size: 'sm' }}>
        {exercise.instructions.execution}
      </Text>
    </div>

    <div>
      <Text
        as="p"
        styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
        className="mb-1 uppercase tracking-wide"
      >
        Tips
      </Text>
      <ul className="space-y-1">
        {exercise.instructions.tips.map((tip) => (
          <li key={tip} className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-ffp-primary-blue" />
            <Text as="span" styleProps={{ size: 'sm' }}>
              {tip}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// ─── Exercise Sidebar Item ───────────────────────────────────────────────────

interface ExerciseSidebarItemProps {
  exercise: MockExercise;
  index: number;
  isCurrent: boolean;
  onClick: () => void;
}

const ExerciseSidebarItem: React.FC<ExerciseSidebarItemProps> = ({
  exercise,
  index,
  isCurrent,
  onClick,
}) => (
  <ClickScale>
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 ${
        isCurrent
          ? 'bg-ffp-dark-blue text-white'
          : exercise.completed
            ? 'opacity-60 hover:bg-muted/50'
            : 'hover:bg-muted/50'
      }`}
    >
      {/* Status indicator */}
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
        {exercise.completed ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ffp-green">
            <Icon name={Icons.CHECK} styleProps={{ size: 'xs', colour: '#ffffff' }} />
          </span>
        ) : isCurrent ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white/60 bg-white/20">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-border">
            <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>{index + 1}</Text>
          </span>
        )}
      </span>

      {/* Exercise name */}
      <Text
        styleProps={{
          size: 'sm',
          weight: isCurrent ? 'medium' : 'normal',
          colour: isCurrent ? 'white' : exercise.completed ? 'muted-foreground' : 'foreground',
        }}
        className={exercise.completed ? 'line-through' : ''}
      >
        {exercise.name}
      </Text>
    </button>
  </ClickScale>
);

// ─── Rest Timer ──────────────────────────────────────────────────────────────

interface RestTimerProps {
  seconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

const RestTimer: React.FC<RestTimerProps> = ({ seconds, onComplete, onSkip }) => {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          onComplete();

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onComplete, seconds]);

  const progressPercent = ((seconds - remaining) / seconds) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex h-full flex-col items-center justify-center text-center"
    >
      <Title as="h2" className="mb-6">
        Rest
      </Title>

      {/* Circular progress */}
      <div className="relative mx-auto mb-8 h-48 w-48">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#ececf0" strokeWidth="6" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="url(#restGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={String(2 * Math.PI * 52)}
            strokeDashoffset={String(2 * Math.PI * 52 * (1 - progressPercent / 100))}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="restGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-ffp-primary-blue)" />
              <stop offset="100%" stopColor="var(--color-ffp-dark-blue)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Text styleProps={{ size: '4xl', weight: 'bold' }}>{String(remaining)}s</Text>
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="secondary" size="md" onClick={onSkip}>
          Skip Rest
        </Button>
      </div>
    </motion.div>
  );
};

// ─── Completion Screen ───────────────────────────────────────────────────────

interface CompletionScreenProps {
  session: MockSession;
  onBackToProgramme: () => void;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ session, onBackToProgramme }) => {
  const completedCount = session.exercises.filter((e) => e.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex h-full w-full flex-col items-center justify-center px-6 text-center"
    >
      {/* Checkmark animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-ffp-green"
      >
        <Icon name={Icons.CHECK} styleProps={{ size: 'xl', colour: '#ffffff' }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Title as="h2" className="mb-2">
          Session Complete
        </Title>
        <Text as="p" styleProps={{ size: 'lg', colour: 'muted-foreground' }} className="mb-8">
          {session.name}
        </Text>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8 flex gap-8"
      >
        <div className="text-center">
          <Text as="p" styleProps={{ size: '2xl', weight: 'bold' }}>
            {String(completedCount)}/{String(session.exercises.length)}
          </Text>
          <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            Exercises
          </Text>
        </div>
        <div className="text-center">
          <Text as="p" styleProps={{ size: '2xl', weight: 'bold' }}>
            {String(session.estimatedDurationMinutes)} min
          </Text>
          <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            Duration
          </Text>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        <Button variant="primary" size="lg" onClick={onBackToProgramme}>
          Back to Programme
        </Button>
      </motion.div>
    </motion.div>
  );
};

// ─── Exit Dialog ─────────────────────────────────────────────────────────────

interface ExitDialogProps {
  completedCount: number;
  totalCount: number;
  onPause: () => void;
  onDone: () => void;
  onCancel: () => void;
}

const ExitDialog: React.FC<ExitDialogProps> = ({
  completedCount,
  totalCount,
  onPause,
  onDone,
  onCancel,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg"
    >
      <Title as="h3" className="mb-2">
        Leaving session?
      </Title>
      <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6">
        You&apos;ve completed {String(completedCount)} of {String(totalCount)} exercises.
      </Text>

      <div className="space-y-3">
        <Button variant="secondary" fullWidth onClick={onPause}>
          Pause — I&apos;ll finish later
        </Button>
        <Button variant="neutral" fullWidth onClick={onDone}>
          I&apos;m done with this session
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Main Session Workout Page ───────────────────────────────────────────────

export const SessionWorkoutMock: React.FC = () => {
  const navigate = useNavigate();
  const session = useMemo(() => getCurrentSession(), []);

  const [exercises, setExercises] = useState<MockExercise[]>(session?.exercises ?? []);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(() => {
    if (!session) {
      return 0;
    }

    const idx = session.exercises.findIndex((e) => !e.completed);

    return idx >= 0 ? idx : 0;
  });
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeExercise = exercises[activeExerciseIndex];
  const completedCount = exercises.filter((e) => e.completed).length;
  const progressPercent = exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;

  // Advance to next exercise
  const advanceToNext = useCallback(() => {
    const nextIncomplete = exercises.findIndex((e, i) => i > activeExerciseIndex && !e.completed);

    if (nextIncomplete >= 0) {
      setActiveExerciseIndex(nextIncomplete);
    } else {
      setIsComplete(true);
    }
  }, [activeExerciseIndex, exercises]);

  // Mark current exercise as complete and advance
  const completeExercise = useCallback(() => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== activeExerciseIndex) {
          return ex;
        }

        return {
          ...ex,
          completed: true,
          setsCompleted: ex.setsCompleted.map(() => true),
        };
      })
    );

    const hasNext = exercises.some((e, i) => i > activeExerciseIndex && !e.completed);

    if (hasNext) {
      // Brief pause before advancing (breathing room)
      setTimeout(() => {
        advanceToNext();
      }, 400);
    } else {
      // All exercises done
      setTimeout(() => {
        setIsComplete(true);
      }, 600);
    }
  }, [activeExerciseIndex, exercises, advanceToNext]);

  // Skip current exercise
  const skipExercise = useCallback(() => {
    const nextIndex = exercises.findIndex((e, i) => i > activeExerciseIndex && !e.completed);

    if (nextIndex >= 0) {
      setActiveExerciseIndex(nextIndex);
    }
  }, [activeExerciseIndex, exercises]);

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Text styleProps={{ colour: 'muted-foreground' }}>No active session found.</Text>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex h-screen bg-white">
        <CompletionScreen
          session={{ ...session, exercises }}
          onBackToProgramme={() => {
            void navigate('/components/programme/overview');
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-muted/20">
      {/* ─── Session Header ─────────────────────────────────────────────── */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => {
            setShowExitDialog(true);
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Icon name={Icons.CLOSE} styleProps={{ size: 'md' }} />
          <Text styleProps={{ size: 'sm', weight: 'medium' }} className="hidden sm:inline">
            Exit Session
          </Text>
        </button>

        <div className="text-center">
          <Text styleProps={{ size: 'sm', weight: 'medium' }}>{session.name}</Text>
          <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="ml-2">
            Exercise {String(activeExerciseIndex + 1)} of {String(exercises.length)}
          </Text>
        </div>

        {/* Desktop sidebar toggle */}
        <button
          type="button"
          onClick={() => {
            setSidebarOpen(!sidebarOpen);
          }}
          className="hidden text-muted-foreground hover:text-foreground lg:block"
        >
          <Icon
            name={sidebarOpen ? Icons.LEFTPANELCLOSE : Icons.LEFTPANELOPEN}
            styleProps={{ size: 'md' }}
          />
        </button>

        {/* Spacer on mobile so header stays centred */}
        <div className="w-6 lg:hidden" />
      </header>

      {/* ─── Progress Bar ───────────────────────────────────────────────── */}
      <div className="h-1 w-full bg-muted">
        <motion.div
          className="h-full bg-gradient-to-r from-ffp-primary-blue to-ffp-dark-blue"
          initial={{ width: 0 }}
          animate={{ width: `${String(progressPercent)}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* ─── Main Content Area ──────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Exercise Sidebar (desktop) */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="hidden flex-shrink-0 overflow-hidden border-r border-border bg-muted/30 lg:block"
            >
              <div className="h-full w-[260px] overflow-y-auto py-4">
                <Text
                  as="p"
                  styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
                  className="mb-3 px-3 uppercase tracking-wide"
                >
                  Exercises
                </Text>
                <div>
                  {exercises.map((exercise, index) => (
                    <ExerciseSidebarItem
                      key={exercise.id}
                      exercise={exercise}
                      index={index}
                      isCurrent={index === activeExerciseIndex}
                      onClick={() => {
                        setActiveExerciseIndex(index);
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Exercise Area */}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <AnimatePresence mode="wait">
            {showRestTimer ? (
              <motion.div
                key="rest-timer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex flex-1 items-center justify-center"
              >
                <RestTimer
                  seconds={activeExercise.restSeconds}
                  onComplete={() => {
                    setShowRestTimer(false);
                  }}
                  onSkip={() => {
                    setShowRestTimer(false);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeExercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6"
              >
                {/* Exercise Title */}
                <Title as="h2" className="mb-4">
                  {activeExercise.name}
                </Title>

                {/* Video Player */}
                <div className="mb-6 overflow-hidden rounded-xl bg-black shadow-md">
                  <video
                    key={activeExercise.id}
                    src={MOCK_VIDEO_URL}
                    className="aspect-video w-full"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                  />
                </div>

                {/* Prescription Badges */}
                <div className="mb-6 flex flex-wrap gap-2">
                  <PrescriptionBadge
                    label={`${String(activeExercise.sets)} ${activeExercise.sets === 1 ? 'set' : 'sets'} × ${activeExercise.reps}`}
                    icon={Icons.REPEAT}
                    variant="blue"
                  />
                  {activeExercise.restSeconds > 0 && (
                    <PrescriptionBadge
                      label={`${String(activeExercise.restSeconds)}s rest`}
                      icon={Icons.CLOCK}
                      variant="purple"
                    />
                  )}
                  {activeExercise.durationSeconds != null && (
                    <PrescriptionBadge
                      label={`${String(activeExercise.durationSeconds)}s`}
                      icon={Icons.CLOCK}
                      variant="green"
                    />
                  )}
                </div>

                {/* Exercise Detail Accordion */}
                <div className="mb-6">
                  <ExerciseDetail exercise={activeExercise} />
                </div>

                {/* Action Buttons — secondary left, primary right */}
                <div className="flex justify-end gap-3">
                  <Button variant="neutral" size="md" onClick={skipExercise}>
                    Skip
                  </Button>
                  {activeExercise.restSeconds > 0 && (
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        setShowRestTimer(true);
                      }}
                    >
                      <Icon name={Icons.CLOCK} styleProps={{ size: 'sm' }} />
                      Rest
                    </Button>
                  )}
                  <Button variant="primary" size="md" onClick={completeExercise}>
                    <Icon name={Icons.CHECK} styleProps={{ size: 'sm', colour: '#ffffff' }} />
                    Mark Complete
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Mobile Exercise Drawer ──────────────────────────────────── */}
          <div className="border-t border-border bg-white px-4 py-3 lg:hidden">
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
              }}
              className="flex w-full items-center justify-between"
            >
              <Text styleProps={{ size: 'sm', weight: 'medium' }}>
                Exercises ({String(completedCount)} of {String(exercises.length)})
              </Text>
              <Icon
                name={Icons.CHEVRONDOWN}
                styleProps={{ size: 'sm', colour: 'var(--color-muted-foreground)' }}
              />
            </button>

            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="space-y-1">
                    {exercises.map((exercise, index) => (
                      <ExerciseSidebarItem
                        key={exercise.id}
                        exercise={exercise}
                        index={index}
                        isCurrent={index === activeExerciseIndex}
                        onClick={() => {
                          setActiveExerciseIndex(index);
                          setSidebarOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ─── Exit Dialog ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showExitDialog && (
          <ExitDialog
            completedCount={completedCount}
            totalCount={exercises.length}
            onPause={() => {
              void navigate('/components/programme/overview');
            }}
            onDone={() => {
              void navigate('/components/programme/overview');
            }}
            onCancel={() => {
              setShowExitDialog(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
