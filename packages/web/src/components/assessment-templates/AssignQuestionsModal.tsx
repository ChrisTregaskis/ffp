import React, { useEffect, useMemo, useState } from 'react';

import { Button, Surface, Text } from '@web/components/atoms';
import { ErrorRetryState, LoadingState, SearchInput } from '@web/components/molecules';
import { Modal } from '@web/components/organisms';
import { useAssignableQuestionsQuery } from '@web/hooks/assessment-templates';

import { AssignableQuestionOption } from './AssignableQuestionOption';

export interface AssignQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  templatePublicId: string;
  /** Receives the ticked questions in the order the pool lists them */
  onConfirm: (questionPublicIds: string[]) => void;
  isSubmitting?: boolean;
}

const confirmLabel = (count: number): string =>
  count === 0 ? 'Add Questions' : `Add ${String(count)} Question${count === 1 ? '' : 's'}`;

/**
 * Search the questions a template does not hold yet and tick several to add at
 * once. The pool comes unpaginated from the server, so the search runs here.
 */
export const AssignQuestionsModal: React.FC<AssignQuestionsModalProps> = ({
  isOpen,
  onClose,
  templatePublicId,
  onConfirm,
  isSubmitting = false,
}) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const {
    data: pool,
    isPending,
    error,
    refetch,
  } = useAssignableQuestionsQuery(templatePublicId, { enabled: isOpen });

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelected(new Set());
    }
  }, [isOpen]);

  // A refreshed pool (after a conflict, say) drops anything no longer assignable
  const selectedInPool = useMemo(
    () => (pool ?? []).filter((question) => selected.has(question.publicId)),
    [pool, selected]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (term === '') {
      return pool ?? [];
    }

    return (pool ?? []).filter(
      (question) =>
        question.questionText.toLowerCase().includes(term) ||
        question.slug.toLowerCase().includes(term)
    );
  }, [pool, search]);

  const toggle = (publicId: string): void => {
    setSelected((previous) => {
      const next = new Set(previous);

      if (next.has(publicId)) {
        next.delete(publicId);
      } else {
        next.add(publicId);
      }

      return next;
    });
  };

  const renderPool = (): React.ReactNode => {
    if (isPending) {
      return <LoadingState layout="area" message="Loading questions…" />;
    }

    if (error && !pool) {
      return (
        <ErrorRetryState
          title="We couldn't load the question bank just now."
          onRetry={() => {
            void refetch();
          }}
        />
      );
    }

    if (filtered.length === 0) {
      return (
        <Text
          as="p"
          className="px-2 py-6 text-center"
          styleProps={{ size: 'sm', colour: 'muted-foreground' }}
        >
          {pool.length === 0
            ? 'Every active question is already on this template.'
            : 'No questions match your search.'}
        </Text>
      );
    }

    return filtered.map((question) => (
      <AssignableQuestionOption
        key={question.publicId}
        question={question}
        isSelected={selected.has(question.publicId)}
        onToggle={toggle}
      />
    ));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Questions"
      subtitle="Choose questions from the bank. They are added after the template's existing questions."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onConfirm(selectedInPool.map((question) => question.publicId));
            }}
            disabled={selectedInPool.length === 0}
            loading={isSubmitting}
          >
            {confirmLabel(selectedInPool.length)}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by question text or slug..."
          ariaLabel="Search questions"
        />

        <Surface radius="md" padding="sm" className="max-h-80 space-y-1 overflow-y-auto">
          {renderPool()}
        </Surface>
      </div>
    </Modal>
  );
};
