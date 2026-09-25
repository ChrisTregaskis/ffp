import type { FlowStepConfig, UserAssessmentScores } from '@ffp/core';

import { ASSESSMENT_MOTION } from '@web/components/assessment';
import { FadeSlideIn } from '@web/components/motion';

import { AssessmentScoresPanel } from './AssessmentScoresPanel';
import { RecommendedProgrammePanel } from './RecommendedProgrammePanel';
import { ResultsActions } from './ResultsActions';
import { ResultsHeader } from './ResultsHeader';
import { ResultsLoadingState } from './ResultsLoadingState';
import { WhatHappensNextPanel } from './WhatHappensNextPanel';

export interface ResultsScreenProps {
  /** Step configuration from the assessment flow */
  config: FlowStepConfig;
  /** Calculated assessment scores (null while loading) */
  scores: UserAssessmentScores | null;
  /** Whether scoring is still in progress */
  isLoading: boolean;
  /** Generated programme ID (null while programme is being created) */
  programmeId: string | null;
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
  programmeId,
  onViewProgramme,
  onKeepProgramme,
  onReplaceProgramme,
  programmeName,
  programmeDescription = 'Personalised based on your assessment results and goals',
  isReassessment = false,
  isReplacing = false,
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
        {scores && (
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
          programmeId={programmeId}
          isReplacing={isReplacing}
          onViewProgramme={onViewProgramme}
          onKeepProgramme={onKeepProgramme}
          onReplaceProgramme={onReplaceProgramme}
        />
      </FadeSlideIn>
    </div>
  );
};
