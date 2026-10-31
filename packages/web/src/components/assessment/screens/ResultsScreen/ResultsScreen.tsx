import type { FlowStepConfig, MemberAssessmentScores, ProgrammeReadiness } from '@ffp/core';

import { FadeSlideIn } from '@web/components/motion';

import { ASSESSMENT_MOTION } from '../../motion.constants';

import { AssessmentScoresPanel } from './AssessmentScoresPanel';
import { RecommendedProgrammePanel } from './RecommendedProgrammePanel';
import { ResultsActions } from './ResultsActions';
import { ResultsHeader } from './ResultsHeader';
import { ResultsLoadingState } from './ResultsLoadingState';
import { visibleScoreDimensions } from './visible-score-dimensions';
import { WhatHappensNextPanel } from './WhatHappensNextPanel';

export interface ResultsScreenProps {
  /** Step configuration from the assessment flow */
  config: FlowStepConfig;
  /** Calculated assessment scores (null while loading) */
  scores: MemberAssessmentScores | null;
  /** Whether scoring is still in progress */
  isLoading: boolean;
  /** Whether the programme is ready, still being put together, or could not be */
  programmeReadiness: ProgrammeReadiness;
  /** Programme name to display in the recommended programme section */
  programmeName?: string | null;
  /** Programme description text */
  programmeDescription?: string;
  /** Callback when user clicks "View My Programme" (first-time assessment) */
  onViewProgramme: () => void;
  /** Whether this assessment is a reassessment (user already has a programme) */
  isReassessment?: boolean;
  /** Callback when user chooses to keep their current programme (reassessment only) */
  onKeepProgramme?: () => void;
  /** Callback when user chooses to replace their programme (reassessment only) */
  onReplaceProgramme?: () => void;
  /** Whether the replace programme mutation is in progress */
  isReplacing?: boolean;
  /** Whether replacing the programme failed */
  hasReplaceFailed?: boolean;
  /** Whether checking on the programme failed while it was still being put together */
  hasReadinessCheckFailed?: boolean;
  /** Checks on the programme again after a failed check */
  onRetryReadinessCheck?: () => void;
}

/**
 * Assessment results screen.
 *
 * Shows a loading state while scoring runs, then the scores, the recommended
 * programme and the next step. Each section is its own component; this one
 * owns the layout and the entrance motion.
 */
export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  config,
  scores,
  isLoading,
  programmeReadiness,
  onViewProgramme,
  onKeepProgramme,
  onReplaceProgramme,
  programmeName,
  programmeDescription = 'Personalised based on your assessment results and goals',
  isReassessment = false,
  isReplacing = false,
  hasReplaceFailed = false,
  hasReadinessCheckFailed = false,
  onRetryReadinessCheck,
}) => {
  if (scores === null && isLoading) {
    return <ResultsLoadingState />;
  }

  const { duration, stagger } = ASSESSMENT_MOTION;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <ResultsHeader
        description={
          config.description ?? 'Thank you for completing your assessment. Here are your results:'
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {scores && visibleScoreDimensions(scores).length > 0 && (
          <FadeSlideIn delay={stagger.second} duration={duration.entrance}>
            <AssessmentScoresPanel scores={scores} />
          </FadeSlideIn>
        )}
        <FadeSlideIn delay={stagger.second} duration={duration.entrance}>
          <RecommendedProgrammePanel
            name={programmeName ?? 'Your Programme'}
            description={programmeDescription}
          />
        </FadeSlideIn>
      </div>

      <FadeSlideIn delay={stagger.third} duration={duration.entrance}>
        <WhatHappensNextPanel />
      </FadeSlideIn>

      <FadeSlideIn delay={stagger.fourth} duration={duration.entrance} slideDistance={0}>
        <ResultsActions
          isReassessment={isReassessment}
          hasScores={scores !== null}
          programmeReadiness={programmeReadiness}
          isReplacing={isReplacing}
          hasReplaceFailed={hasReplaceFailed}
          hasReadinessCheckFailed={hasReadinessCheckFailed}
          onRetryReadinessCheck={onRetryReadinessCheck}
          onViewProgramme={onViewProgramme}
          onKeepProgramme={onKeepProgramme}
          onReplaceProgramme={onReplaceProgramme}
        />
      </FadeSlideIn>
    </div>
  );
};
