import { useCallback, useState } from 'react';

import { Button, type ButtonVariant, Icon, Icons } from '@web/components/atoms';
import { StaticAlert } from '@web/components/molecules';
import { ASSESSMENT_ACTION } from '@web/contexts/assessments/constants';
import { useAssessment } from '@web/contexts/assessments/useAssessment';
import { useSaveProgress } from '@web/hooks/assessments/useSaveProgress';
import { useShowRefusedAnswers } from '@web/hooks/assessments/useShowRefusedAnswers';
import { toQuestionFieldErrors } from '@web/utils/assessment-field-errors';

export interface AssessmentNavigationProps {
  /** Whether to show the Back button (hide on first step) */
  showBack?: boolean;
  /** Label for the continue button @default 'Continue' */
  continueLabel?: string;
  /** Visual variant for the continue button @default 'primary' */
  continueVariant?: ButtonVariant;
  /** Whether the Continue button is disabled (e.g. required question unanswered) */
  continueDisabled?: boolean;
  /** Custom handler for Continue — overrides default save-then-navigate */
  onContinue?: () => void;
  /**
   * Whether `onContinue` submits the assessment. The submit sends every answer itself, so no
   * background save is fired alongside it to race the submission.
   */
  isSubmit?: boolean;
  /** Custom handler for Back — overrides default save-then-navigate */
  onBack?: () => void;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Assessment navigation component.
 *
 * Provides Back and Continue buttons with auto-save behaviour.
 * When answers are dirty, saves progress before navigating.
 * Supports branching via nextStepId from save response.
 * A refused save keeps the member on the step: answers the server named carry its message
 * on their question, and any other failure shows above the buttons.
 */
export const AssessmentNavigation: React.FC<AssessmentNavigationProps> = ({
  showBack = true,
  continueLabel = 'Continue',
  continueVariant = 'primary',
  continueDisabled = false,
  onContinue,
  isSubmit = false,
  onBack,
  className = '',
}) => {
  const { assessmentState, assessmentDispatch } = useAssessment();
  const saveProgress = useSaveProgress();
  const showRefusedAnswers = useShowRefusedAnswers();

  const { assessmentId, answers, currentStep, isDirty } = assessmentState;
  // Set by a step-level save whose failure could not be shown on a question; background saves stay quiet
  const [hasSaveFailed, setHasSaveFailed] = useState(false);
  const isSaving = saveProgress.isPending;

  const handleSaveAndNavigate = useCallback(
    async (direction: 'forward' | 'back') => {
      // Always save — even when answers are clean — so the backend can persist
      // the current step position for accurate resume on re-login.
      if (assessmentId) {
        let response;

        try {
          response = await saveProgress.mutateAsync({
            assessmentId,
            payload: { answers, currentStep, advance: direction === 'forward' },
          });
        } catch (error) {
          // A refusal is shown on its questions; one that cannot be, and any other failure, here
          const isShown = await showRefusedAnswers(toQuestionFieldErrors(error));

          setHasSaveFailed(!isShown);

          return;
        }

        setHasSaveFailed(false);

        if (isDirty) {
          assessmentDispatch({ type: ASSESSMENT_ACTION.MARK_SAVED });
        }

        if (direction === 'forward') {
          assessmentDispatch({
            type: ASSESSMENT_ACTION.NEXT_STEP,
            payload: response.nextStepId ? { nextStepId: response.nextStepId } : undefined,
          });
        } else {
          assessmentDispatch({ type: ASSESSMENT_ACTION.PREV_STEP });
        }
      } else {
        if (direction === 'forward') {
          assessmentDispatch({ type: ASSESSMENT_ACTION.NEXT_STEP });
        } else {
          assessmentDispatch({ type: ASSESSMENT_ACTION.PREV_STEP });
        }
      }
    },
    [
      isDirty,
      assessmentId,
      answers,
      currentStep,
      saveProgress,
      assessmentDispatch,
      showRefusedAnswers,
    ]
  );

  /**
   * Fire-and-forget save to persist currentStep for resume.
   * Used during intra-step navigation (question-to-question) where
   * the custom onContinue/onBack handles the UI transition. A failure stays quiet: the
   * answers stay dirty, and the step-level save resends them and shows any refusal.
   */
  const savePositionInBackground = useCallback((): void => {
    if (assessmentId && isDirty) {
      void saveProgress
        .mutateAsync({
          assessmentId,
          payload: { answers, currentStep },
        })
        .then(() => {
          assessmentDispatch({ type: ASSESSMENT_ACTION.MARK_SAVED });
        })
        .catch(() => {
          // Background save failed — answers remain in local state and will
          // be retried on the next navigation or step transition.
        });
    }
  }, [assessmentId, isDirty, answers, currentStep, saveProgress, assessmentDispatch]);

  const handleContinue = useCallback(() => {
    if (onContinue) {
      if (!isSubmit) {
        savePositionInBackground();
      }

      onContinue();

      return;
    }

    void handleSaveAndNavigate('forward');
  }, [onContinue, isSubmit, savePositionInBackground, handleSaveAndNavigate]);

  const handleBack = useCallback(() => {
    if (onBack) {
      savePositionInBackground();
      onBack();

      return;
    }

    void handleSaveAndNavigate('back');
  }, [onBack, savePositionInBackground, handleSaveAndNavigate]);

  return (
    <div className="space-y-4">
      {hasSaveFailed && (
        <StaticAlert
          variant="error"
          message="We couldn't save your answers just now. Please try again."
        />
      )}
      <nav
        className={`flex items-center justify-between ${className}`.trim()}
        aria-label="Assessment navigation"
      >
        <div>
          {showBack && (
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={isSaving}
              icon={<Icon name={Icons.CHEVRONLEFT} styleProps={{ size: 'sm' }} />}
            >
              Back
            </Button>
          )}
        </div>

        <Button
          variant={continueVariant}
          onClick={handleContinue}
          disabled={isSaving || continueDisabled}
          loading={isSaving}
          icon={<Icon name={Icons.CHEVRONRIGHT} styleProps={{ size: 'sm' }} />}
          iconPosition="right"
        >
          {isSaving ? 'Saving...' : continueLabel}
        </Button>
      </nav>
    </div>
  );
};
