import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  NOT_SCORABLE_MESSAGES,
  ScoringHelpPanel,
  ScoringRunner,
  planScenarios,
  type ScenarioAnswers,
} from '@web/components/assessment-flows';
import { Button, ContentPanel, PageContainer, Text } from '@web/components/atoms';
import {
  ErrorRetryState,
  LoadingState,
  PageHeader,
  PageState,
  StaticAlert,
} from '@web/components/molecules';
import { RouteKey, routes } from '@web/config/routes';
import {
  useAssessmentFlowDetailQuery,
  useFlowScoringDryRunQuery,
} from '@web/hooks/assessment-flows';

const NO_ANSWERS: ScenarioAnswers = {};

export const AssessmentFlowScoringPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<ScenarioAnswers>(NO_ANSWERS);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const flowQuery = useAssessmentFlowDetailQuery(publicId ?? '');
  const requestAnswers = useMemo(
    () =>
      Object.entries(answers)
        .filter(([, value]) => value !== '')
        .map(([questionPublicId, answerValue]) => ({ questionPublicId, answerValue })),
    [answers]
  );
  const dryRun = useFlowScoringDryRunQuery(publicId ?? '', requestAnswers);
  const scorable = dryRun.data?.result.scorable ? dryRun.data.result : undefined;
  const scoredAnswers = useMemo(
    (): ScenarioAnswers =>
      Object.fromEntries(
        (dryRun.data?.answers ?? []).map((answer) => [
          answer.questionPublicId,
          String(answer.answerValue),
        ])
      ),
    [dryRun.data?.answers]
  );
  const plan = useMemo(
    () => (scorable ? planScenarios(scorable.dimensions) : undefined),
    [scorable]
  );

  const firstScenario = plan?.fits ? plan.scenarios.at(0) : undefined;

  useEffect(() => {
    if (firstScenario && answers === NO_ANSWERS) {
      setAnswers(firstScenario.answers);
    }
  }, [firstScenario, answers]);

  const handleNavigateToFlows = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_ASSESSMENTS].path);
  }, [navigate]);

  const flowName = flowQuery.data?.name;

  return (
    <PageContainer>
      <PageHeader
        title={flowName ? `${flowName} — Scoring` : 'Flow Scoring'}
        subtitle="Try answers against this flow’s scoring and see the level they lead to. Nothing is saved."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              setIsHelpOpen(true);
            }}
          >
            How scoring works
          </Button>
        }
      />

      {flowQuery.error && !flowQuery.data && (
        <PageState
          isLoading={false}
          title="Unable to load flow"
          message={flowQuery.error.message}
          actionLabel="Back to Assessment Flows"
          onAction={handleNavigateToFlows}
        />
      )}

      {!flowQuery.error && (
        <ContentPanel>
          {dryRun.isPending && <LoadingState message="Reading this flow’s scoring" />}

          {dryRun.error && !dryRun.data && (
            <ErrorRetryState
              title="We couldn’t score this flow just now."
              onRetry={() => {
                void dryRun.refetch();
              }}
            />
          )}

          {dryRun.data && !dryRun.data.result.scorable && (
            <StaticAlert
              variant="info"
              appearance="soft"
              message={NOT_SCORABLE_MESSAGES[dryRun.data.result.reason]}
            />
          )}

          {plan && !plan.fits && (
            <div className="space-y-3">
              <StaticAlert
                variant="warning"
                appearance="soft"
                message="This flow’s scoring does not fit the scenario runner, so there are no scenarios to try."
              />
              <ul className="list-disc space-y-1 pl-5">
                {plan.reasons.map((reason) => (
                  <li key={reason}>
                    <Text as="span" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                      {reason}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ContentPanel>
      )}

      {/* Outside ContentPanel, which is half width */}
      {!flowQuery.error && scorable && plan?.fits && answers !== NO_ANSWERS && (
        <ScoringRunner
          dryRun={scorable}
          scenarios={plan.scenarios}
          tallyScores={plan.tallyScores}
          answers={answers}
          scoredAnswers={scoredAnswers}
          onAnswersChange={setAnswers}
          isSettling={dryRun.isSettling}
        />
      )}

      <ScoringHelpPanel
        isOpen={isHelpOpen}
        onClose={() => {
          setIsHelpOpen(false);
        }}
        mappings={scorable?.mappings}
      />
    </PageContainer>
  );
};
