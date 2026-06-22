import { useState } from 'react';

import { Button } from '@web/components/button';
import { DropdownMenu } from '@web/components/dropdown-menu';
import { Icon, Icons } from '@web/components/Icon';
import { SearchInput } from '@web/components/search';
import { Select } from '@web/components/select';
import { Text } from '@web/components/text';

import { DIMENSION_LABELS, QUESTION_TYPE_LABELS } from './prototype-labels';
import { QUESTION_TYPES, type QuestionType } from './prototype-types';
import { usePrototypeStore } from './PrototypeStore';
import { QuestionTypeBadge } from './QuestionTypeBadge';
import { StatusPill } from './StatusPill';
import { ViewHeader } from './ViewHeader';

type TypeFilter = QuestionType | 'all';

/** Question bank — browse and manage the question library (T3-3). */
export const QuestionBankView: React.FC = () => {
  const { questions, navigate, toggleQuestionActive } = usePrototypeStore();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = questions.filter((question) => {
    const matchesType = typeFilter === 'all' || question.type === typeFilter;
    const matchesSearch =
      search.trim() === '' ||
      question.questionText.toLowerCase().includes(search.toLowerCase()) ||
      question.slug.toLowerCase().includes(search.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div>
      <ViewHeader
        title="Question bank"
        subtitle="The reusable questions that flows and templates are built from."
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Icon name={Icons.PLUS} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={() => {
              navigate({ name: 'question-edit', questionId: 'new' });
            }}
          >
            New question
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search questions…" />
        </div>
        <div className="w-64">
          <Select
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value as TypeFilter);
            }}
            ariaLabel="Filter by question type"
            options={[
              { value: 'all', label: 'All types' },
              ...QUESTION_TYPES.map((type) => ({ value: type, label: QUESTION_TYPE_LABELS[type] })),
            ]}
          />
        </div>
        <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          {filtered.length} of {questions.length}
        </Text>
      </div>

      <div className="space-y-2">
        {filtered.map((question) => (
          <div
            key={question.id}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Text styleProps={{ weight: 'medium' }}>{question.questionText}</Text>
                <QuestionTypeBadge type={question.type} />
                {!question.isActive && <StatusPill active={false} inactiveLabel="Inactive" />}
              </div>
              <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                {question.slug}
                {question.scoreDimension
                  ? ` · scores ${DIMENSION_LABELS[question.scoreDimension]}`
                  : ' · not scored'}
                {question.options ? ` · ${String(question.options.length)} options` : ''}
              </Text>
            </div>

            <div className="flex shrink-0">
              <DropdownMenu
                label="Actions"
                size="sm"
                items={[
                  {
                    label: 'Edit',
                    onClick: () => {
                      navigate({ name: 'question-edit', questionId: question.id });
                    },
                  },
                  {
                    label: question.isActive ? 'Deactivate' : 'Reactivate',
                    onClick: () => {
                      toggleQuestionActive(question.id);
                    },
                    variant: question.isActive ? 'danger' : 'default',
                  },
                ]}
              />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
            <Text styleProps={{ colour: 'muted-foreground' }}>
              No questions match your filters.
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};
