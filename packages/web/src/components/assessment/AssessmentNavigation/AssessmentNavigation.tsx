import { useCallback } from 'react';

import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { ASSESSMENT_ACTION } from '@web/contexts/AssessmentContext/constants';
import { useAssessment } from '@web/contexts/AssessmentContext/useAssessment';
import { useSaveProgress } from '@web/hooks/assessments/useSaveProgress';

export interface AssessmentNavigationProps {
  /** Whether to show the Back button (hide on first step) */
  showBack?: boolean;
  /** Label for the continue button @default 'Continue' */
  continueLabel?: string;
  /** Custom handler for Continue — overrides default save-then-navigate */
  onContinue?: () => void;
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
 */
export const AssessmentNavigation: React.FC<AssessmentNavigationProps> = ({
  showBack = true,
  continueLabel = 'Continue',
  onContinue,
  onBack,
  className = '',
}) => {
  const { assessmentState, assessmentDispatch } = useAssessment();
  const saveProgress = useSaveProgress();

  const { assessmentId, answers, currentStep, isDirty } = assessmentState;
  const isSaving = saveProgress.isPending;

  const handleSaveAndNavigate = useCallback(
    async (direction: 'forward' | 'back') => {
      if (isDirty && assessmentId) {
        const response = await saveProgress.mutateAsync({
          assessmentId,
          payload: { answers, currentStep },
        });

        assessmentDispatch({ type: ASSESSMENT_ACTION.MARK_SAVED });

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
    [isDirty, assessmentId, answers, currentStep, saveProgress, assessmentDispatch]
  );

  const handleContinue = useCallback(() => {
    if (onContinue) {
      onContinue();
      return;
    }

    void handleSaveAndNavigate('forward');
  }, [onContinue, handleSaveAndNavigate]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }

    void handleSaveAndNavigate('back');
  }, [onBack, handleSaveAndNavigate]);

  return (
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
        variant="primary"
        onClick={handleContinue}
        disabled={isSaving}
        loading={isSaving}
        icon={<Icon name={Icons.CHEVRONRIGHT} styleProps={{ size: 'sm' }} />}
        iconPosition="right"
      >
        {isSaving ? 'Saving...' : continueLabel}
      </Button>
    </nav>
  );
};
