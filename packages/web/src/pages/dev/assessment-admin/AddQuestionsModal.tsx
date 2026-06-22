import { useEffect, useMemo, useState } from 'react';

import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Modal } from '@web/components/modal';
import { SearchInput } from '@web/components/search';
import { Text } from '@web/components/text';

import { SCROLL_CLASS } from './prototype-styles';
import { QuestionTypeBadge } from './QuestionTypeBadge';

import type { PrototypeQuestion } from './prototype-types';

/** Stable empty default so the seed effect doesn't re-run every render. */
const EMPTY_IDS: string[] = [];

interface AddQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The selectable pool of questions (all of them in amend mode, or just the unchosen ones) */
  availableQuestions: PrototypeQuestion[];
  /** Returns the full set of ticked question ids on confirm */
  onConfirm: (questionIds: string[]) => void;
  /** Ids ticked when the modal opens (amend mode) */
  initialSelectedIds?: string[];
  title?: string;
  subtitle?: string;
  /** Footer button label (defaults to "Add N questions") */
  confirmLabel?: string;
  /** Allow confirming with nothing selected (amend mode, where you may clear the list) */
  allowEmpty?: boolean;
}

/** Search-and-select modal for managing questions (templates or scoring dimensions). */
export const AddQuestionsModal: React.FC<AddQuestionsModalProps> = ({
  isOpen,
  onClose,
  availableQuestions,
  onConfirm,
  initialSelectedIds = EMPTY_IDS,
  title = 'Add questions',
  subtitle = 'Search the question bank and select one or more to add to this template.',
  confirmLabel,
  allowEmpty = false,
}) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Seed selection + clear search each time the modal opens.
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelected(new Set(initialSelectedIds));
    }
  }, [isOpen, initialSelectedIds]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (term === '') {
      return availableQuestions;
    }

    return availableQuestions.filter(
      (question) =>
        question.questionText.toLowerCase().includes(term) ||
        question.slug.toLowerCase().includes(term)
    );
  }, [availableQuestions, search]);

  const selectedQuestions = useMemo(
    () => availableQuestions.filter((question) => selected.has(question.id)),
    [availableQuestions, selected]
  );

  const toggle = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const handleConfirm = (): void => {
    onConfirm([...selected]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleConfirm}
            disabled={!allowEmpty && selected.size === 0}
          >
            {confirmLabel ??
              (selected.size === 0
                ? 'Add questions'
                : `Add ${String(selected.size)} question${selected.size === 1 ? '' : 's'}`)}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search the question bank…" />

        {selectedQuestions.length > 0 && (
          <div className="space-y-1 rounded-md bg-muted/50 p-2">
            <Text styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}>
              Selected ({selectedQuestions.length})
            </Text>
            {selectedQuestions.map((question) => (
              <div key={question.id} className="flex items-center gap-2">
                <Text as="p" styleProps={{ size: 'sm' }} className="min-w-0 flex-1 truncate">
                  {question.questionText}
                </Text>
                <button
                  type="button"
                  aria-label={`Remove ${question.questionText}`}
                  onClick={() => {
                    toggle(question.id);
                  }}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Icon name={Icons.TRASH2} styleProps={{ size: 'sm', colour: 'currentColor' }} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className={`max-h-80 space-y-1 overflow-y-auto rounded-md border border-border p-2 ${SCROLL_CLASS}`}
        >
          {filtered.map((question) => (
            <label
              key={question.id}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={selected.has(question.id)}
                onChange={() => {
                  toggle(question.id);
                }}
              />
              <span className="min-w-0 flex-1">
                <Text as="p" styleProps={{ size: 'sm', weight: 'medium' }}>
                  {question.questionText}
                </Text>
                <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                  {question.slug}
                </Text>
              </span>
              <QuestionTypeBadge type={question.type} />
            </label>
          ))}

          {filtered.length === 0 && (
            <div className="px-2 py-6 text-center">
              <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                {availableQuestions.length === 0
                  ? 'No questions available.'
                  : 'No questions match your search.'}
              </Text>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
