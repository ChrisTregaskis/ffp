import type { AdminQuestion } from '@ffp/core';

import { ACTIVE_STATUS_MAP, createColumns, toActiveStatus } from '@web/components/organisms';
import type { RowAction } from '@web/components/organisms';
import { QUESTION_TYPE_LABELS, SCORE_DIMENSION_LABELS } from '@web/components/questions';

import type { ColumnDef } from '@tanstack/react-table';

/**
 * Row type for the question list. `type` and `scoreDimension` carry display
 * labels; the column ids stay the API's sort keys.
 */
export type QuestionRow = {
  id: string;
  publicId: string;
  questionText: string;
  slug: string;
  type: string;
  scoreDimension: string;
  isActive: boolean;
  status: string;
} & Record<string, unknown>;

export const toQuestionRow = (question: AdminQuestion): QuestionRow => ({
  id: question.id,
  publicId: question.publicId,
  questionText: question.questionText,
  slug: question.slug,
  type: QUESTION_TYPE_LABELS[question.type],
  scoreDimension: question.scoreDimension ? SCORE_DIMENSION_LABELS[question.scoreDimension] : '—',
  isActive: question.isActive,
  status: toActiveStatus(question.isActive),
});

const columns = createColumns<QuestionRow>();

/** Actions are injected by the page component (navigation + mutations). */
export const buildQuestionColumns = (
  actions: RowAction<QuestionRow>[] | ((row: QuestionRow) => RowAction<QuestionRow>[])
): ColumnDef<QuestionRow>[] => [
  columns.text('questionText', { label: 'Question', sortable: true }),
  columns.text('slug', { label: 'Slug', sortable: true }),
  columns.text('type', { label: 'Type', sortable: true }),
  columns.text('scoreDimension', { label: 'Scores towards', sortable: true }),
  columns.status('status', { label: 'Status', statusMap: ACTIVE_STATUS_MAP }),
  columns.actions({ actions }),
];
