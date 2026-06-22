import { useState } from 'react';

import { Button } from '@web/components/button';
import { ContentPanel } from '@web/components/layout';
import { Text } from '@web/components/text';

import { InfoNote } from './InfoNote';
import { OptionListEditor } from './OptionListEditor';
import { CHOICE_TYPES, DIMENSION_LABELS, QUESTION_TYPE_LABELS } from './prototype-labels';
import {
  QUESTION_TYPES,
  SCORE_DIMENSIONS,
  type PrototypeQuestion,
  type QuestionOption,
  type QuestionType,
  type QuestionValidation,
  type ScoreDimension,
} from './prototype-types';
import { PrototypeSelectField } from './PrototypeSelectField';
import { usePrototypeStore } from './PrototypeStore';
import { PrototypeTextField } from './PrototypeTextField';
import { ValidationFieldset } from './ValidationFieldset';
import { ViewHeader } from './ViewHeader';

const EMPTY_QUESTION: PrototypeQuestion = {
  id: 'new',
  publicId: '',
  slug: '',
  type: 'single-choice',
  questionText: '',
  description: '',
  options: [],
  validation: { required: true },
  scoreDimension: null,
  isActive: true,
};

/** Create or edit a question, with per-type option + validation editors (T3-3). */
export const QuestionEditorView: React.FC<{ questionId: string }> = ({ questionId }) => {
  const { questions, navigate, saveQuestion } = usePrototypeStore();
  const existing = questions.find((question) => question.id === questionId);
  const isNew = questionId === 'new';

  const [draft, setDraft] = useState<PrototypeQuestion>(existing ?? EMPTY_QUESTION);

  const update = <K extends keyof PrototypeQuestion>(key: K, value: PrototypeQuestion[K]): void => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const isChoice = CHOICE_TYPES.includes(draft.type);

  const handleTypeChange = (type: QuestionType): void => {
    setDraft((prev) => ({
      ...prev,
      type,
      // Reset options when moving away from a choice type
      options: CHOICE_TYPES.includes(type) ? (prev.options ?? []) : undefined,
    }));
  };

  const handleSave = (): void => {
    saveQuestion(draft);
    navigate({ name: 'questions' });
  };

  return (
    <div>
      <ViewHeader
        title={isNew ? 'New question' : 'Edit question'}
        subtitle="Author the question text, options and validation for a single question."
      />

      <ContentPanel>
        <div className="space-y-5">
          <PrototypeTextField
            label="Question text"
            value={draft.questionText}
            onChange={(value) => {
              update('questionText', value);
            }}
            placeholder="What would you like to ask?"
          />

          <div className="grid grid-cols-2 gap-4">
            <PrototypeSelectField
              label="Question type"
              value={draft.type}
              onChange={(value) => {
                handleTypeChange(value as QuestionType);
              }}
              options={QUESTION_TYPES.map((type) => ({
                value: type,
                label: QUESTION_TYPE_LABELS[type],
              }))}
            />

            <PrototypeTextField
              label="Slug"
              value={draft.slug}
              onChange={(value) => {
                update('slug', value);
              }}
              placeholder="e.g. goal-primary"
              hint="A stable identifier used by branching and scoring rules."
            />
          </div>

          <PrototypeTextField
            label="Description (optional)"
            value={draft.description ?? ''}
            onChange={(value) => {
              update('description', value);
            }}
            placeholder="Extra guidance shown beneath the question"
            textarea
          />

          <PrototypeSelectField
            label="Score dimension (optional)"
            value={draft.scoreDimension ?? ''}
            onChange={(value) => {
              update('scoreDimension', value === '' ? null : (value as ScoreDimension));
            }}
            options={SCORE_DIMENSIONS.map((dimension) => ({
              value: dimension,
              label: DIMENSION_LABELS[dimension],
            }))}
            placeholder="Not scored"
            hint="Which wellness dimension this question contributes to, if any."
          />

          {draft.type === 'video-response' && (
            <InfoNote>
              Video-response questions link to a guidance video. In the real build this is a video
              picker; here it is left as a placeholder.
            </InfoNote>
          )}

          {isChoice && (
            <OptionListEditor
              options={draft.options ?? []}
              onChange={(options: QuestionOption[]) => {
                update('options', options);
              }}
              showScores={draft.scoreDimension !== null}
            />
          )}

          <ValidationFieldset
            type={draft.type}
            validation={draft.validation ?? {}}
            onChange={(validation: QuestionValidation) => {
              update('validation', validation);
            }}
          />

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
              {isNew ? 'This question will be added to the bank.' : `Editing ${draft.slug}`}
            </Text>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  navigate({ name: 'questions' });
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleSave}>
                {isNew ? 'Create question' : 'Save question'}
              </Button>
            </div>
          </div>
        </div>
      </ContentPanel>
    </div>
  );
};
