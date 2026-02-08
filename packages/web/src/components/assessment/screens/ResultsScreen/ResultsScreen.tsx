import type { FlowStepConfig, UserAssessmentScores } from '@ffp/core';

import { SectionHeader, SectionPanel } from '@web/components/assessment';
import { Button } from '@web/components/button';
import { IconBadge, Icons } from '@web/components/Icon';
import type { IconName } from '@web/components/Icon';
import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { Text } from '@web/components/text';

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
  programmeName?: string;
  /** Programme description text */
  programmeDescription?: string;
  /** Callback when user clicks "View My Programme" */
  onViewProgramme: () => void;
}

/** Risk level badge styling */
const RISK_BADGE_STYLES = {
  low: 'bg-success text-white',
  moderate: 'bg-warning text-white',
  high: 'bg-destructive text-white',
} as const;

/** "What Happens Next" feature items */
const NEXT_STEPS: { icon: IconName; heading: string; description: string }[] = [
  {
    icon: Icons.CLIPBOARDLIST,
    heading: 'Programme Overview',
    description: 'Review your personalised exercise programme and features',
  },
  {
    icon: Icons.PLAY,
    heading: 'Start Training',
    description: 'Begin your guided exercises with video instructions',
  },
  {
    icon: Icons.CALENDAR,
    heading: 'Track Progress',
    description: 'Monitor your improvement with regular assessments',
  },
];

/**
 * Assessment results screen.
 *
 * Standalone screen that displays assessment scores,
 * recommended programme, and a CTA to view the generated programme.
 * Shows a loading state while waiting for scoring to complete.
 */
export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  config,
  scores,
  isLoading,
  programmeId,
  programmeName = 'Your Programme',
  programmeDescription = 'Personalised based on your assessment results and goals',
  onViewProgramme,
}) => {
  // Loading state — scoring in progress
  if (scores === null && isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <SectionPanel>
          <div className="flex flex-col items-center gap-5 px-6 py-16">
            <div className="animate-pulse rounded-full bg-primary/10 p-5">
              <LoadingSpinner size="lg" />
            </div>
            <div className="text-center">
              <Text
                as="h1"
                styleProps={{ size: '2xl', weight: 'bold', colour: 'ffp-navy' }}
                className="tracking-tight"
              >
                Calculating Your Results...
              </Text>
              <Text
                as="p"
                styleProps={{ size: 'base', colour: 'muted-foreground' }}
                className="mt-2"
              >
                We&apos;re analysing your responses to match against a programme.
              </Text>
            </div>
          </div>
        </SectionPanel>
      </div>
    );
  }

  // Results state — scores available
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 text-center">
        <IconBadge
          name={Icons.CHECKCIRCLE}
          size="lg"
          variant="success"
          appearance="solid"
          shape="circle"
        />
        <div>
          <Text
            as="h1"
            styleProps={{ size: '3xl', weight: 'bold', colour: 'ffp-navy' }}
            className="tracking-tight"
          >
            Assessment Complete!
          </Text>
          <Text as="p" styleProps={{ size: 'lg', colour: 'muted-foreground' }} className="mt-2">
            {config.description ??
              'Thank you for completing your physiotherapy assessment. Here are your results:'}
          </Text>
        </div>
      </div>

      {/* Two-column: Assessment Scores + Recommended Programme */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Assessment Scores */}
        {scores && (
          <SectionPanel>
            <div className="px-5 pt-5 pb-4">
              <SectionHeader icon={Icons.TARGET} title="Assessment Scores" as="h2" />
            </div>

            <div className="space-y-3 px-5 pb-5">
              {/* Dimension score rows */}
              {scores.dimensions.map((dimension) => (
                <div
                  key={dimension.dimensionId}
                  className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3"
                >
                  <Text as="span" styleProps={{ weight: 'medium' }}>
                    {dimension.dimensionName} Score:
                  </Text>
                  <Text as="span" styleProps={{ size: 'xl', weight: 'bold', colour: 'warning' }}>
                    {String(dimension.normalisedScore)}
                    <Text as="span" styleProps={{ size: 'xl', weight: 'bold', colour: 'warning' }}>
                      /100
                    </Text>
                  </Text>
                </div>
              ))}

              {/* Risk Level row */}
              {scores.riskLevel && (
                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                  <Text as="span" styleProps={{ weight: 'medium' }}>
                    Risk Level:
                  </Text>
                  <span
                    className={`rounded-lg px-4 py-1.5 text-sm font-bold ${RISK_BADGE_STYLES[scores.riskLevel]}`}
                  >
                    {scores.riskLevel.charAt(0).toUpperCase() + scores.riskLevel.slice(1)}
                  </span>
                </div>
              )}
            </div>
          </SectionPanel>
        )}

        {/* Recommended Programme */}
        <SectionPanel variant="tinted" className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <SectionHeader icon={Icons.TRENDINGUP} title="Recommended Programme" as="h2" />
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-5 pb-8 text-center">
            <Text
              as="h3"
              styleProps={{ size: '2xl', weight: 'bold' }}
              className="bg-linear-to-r from-ffp-primary-blue to-ffp-dark-blue bg-clip-text text-transparent"
            >
              {programmeName}
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-2">
              {programmeDescription}
            </Text>
          </div>
        </SectionPanel>
      </div>

      {/* What Happens Next */}
      <SectionPanel variant="tinted" className="p-6">
        <Text as="h2" styleProps={{ size: 'xl', weight: 'bold', colour: 'ffp-navy' }}>
          What Happens Next?
        </Text>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {NEXT_STEPS.map((step) => (
            <div key={step.heading} className="flex flex-col items-center text-center">
              <IconBadge name={step.icon} size="lg" variant="primary" appearance="solid" />
              <Text
                as="h3"
                styleProps={{ weight: 'semibold', colour: 'ffp-navy' }}
                className="mt-3"
              >
                {step.heading}
              </Text>
              <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-1">
                {step.description}
              </Text>
            </div>
          ))}
        </div>
      </SectionPanel>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <Button
          variant="primary"
          size="lg"
          onClick={onViewProgramme}
          disabled={programmeId === null}
        >
          View My Programme
        </Button>
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          Your assessment results and programme will be saved to your account.
        </Text>
      </div>
    </div>
  );
};
