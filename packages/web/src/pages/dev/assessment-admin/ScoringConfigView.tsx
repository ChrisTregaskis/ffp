import { useState } from 'react';

import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';

import { InfoNote } from './InfoNote';
import { LEVEL_SCENARIOS } from './prototype-data';
import { type SampleAnswers } from './prototype-scoring';
import { usePrototypeStore } from './PrototypeStore';
import { ScoringHelpContent } from './ScoringHelpContent';
import { ScoringTestPanel } from './ScoringTestPanel';
import { SlideOver } from './SlideOver';
import { ViewHeader } from './ViewHeader';

/** Scenario runner — check the questions produce the right level; the rule itself lives in help. */
export const ScoringConfigView: React.FC<{ flowId: string }> = ({ flowId }) => {
  const { flows, questions } = usePrototypeStore();
  const flow = flows.find((item) => item.id === flowId);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(true);
  const [answers, setAnswers] = useState<SampleAnswers>(() => ({
    ...LEVEL_SCENARIOS[0].answers,
  }));

  if (!flow) {
    return <ViewHeader title="Flow not found" />;
  }

  return (
    <div>
      {isNoteOpen && (
        <div className="mb-6">
          <InfoNote
            onDismiss={() => {
              setIsNoteOpen(false);
            }}
          >
            Nothing is configured here — this page is for seeing how this assessment flow scores
            answers into a level. The scoring inputs (the activity questions and their option
            scores) live in the Question bank.
          </InfoNote>
        </div>
      )}

      <ViewHeader
        title="Scoring"
        subtitle={`Run scenarios to check ${flow.name} produces the right level from its answers.`}
        actions={
          <Button
            variant="secondary"
            size="md"
            icon={
              <Icon name={Icons.HELPCIRCLE} styleProps={{ size: 'sm', colour: 'currentColor' }} />
            }
            onClick={() => {
              setIsHelpOpen(true);
            }}
          >
            How scoring works
          </Button>
        }
      />

      <ScoringTestPanel
        questions={questions}
        scenarios={LEVEL_SCENARIOS}
        answers={answers}
        onAnswersChange={setAnswers}
      />

      <SlideOver
        isOpen={isHelpOpen}
        onClose={() => {
          setIsHelpOpen(false);
        }}
        title="How scoring works"
        subtitle="From answers to a starting level."
      >
        <ScoringHelpContent />
      </SlideOver>
    </div>
  );
};
