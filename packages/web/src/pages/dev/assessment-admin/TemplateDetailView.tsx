import { useState } from 'react';

import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

import { AddQuestionsModal } from './AddQuestionsModal';
import { usePrototypeStore } from './PrototypeStore';
import { PrototypeTextField } from './PrototypeTextField';
import { QuestionTypeBadge } from './QuestionTypeBadge';
import { ViewHeader } from './ViewHeader';

import type { PrototypeQuestion } from './prototype-types';

/** Manage the questions in a single template — add, remove and reorder (T3-4). */
export const TemplateDetailView: React.FC<{ templateId: string }> = ({ templateId }) => {
  const {
    templates,
    questions,
    renameTemplate,
    assignQuestion,
    unassignQuestion,
    reorderTemplateQuestion,
  } = usePrototypeStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const template = templates.find((item) => item.id === templateId);

  if (!template) {
    return <ViewHeader title="Template not found" />;
  }

  const byId = (id: string): PrototypeQuestion | undefined =>
    questions.find((question) => question.id === id);

  const assigned = template.questionIds.map(byId).filter((q): q is PrototypeQuestion => Boolean(q));
  const available = questions.filter(
    (question) => question.isActive && !template.questionIds.includes(question.id)
  );

  const handleAdd = (ids: string[]): void => {
    ids.forEach((id) => {
      assignQuestion(template.id, id);
    });
  };

  // Live reorder: as the dragged card hovers a new slot, move it there so the
  // other cards shift to make room (the dragged card itself stays semi-transparent).
  const handleDragEnter = (overIndex: number): void => {
    if (draggingId === null) {
      return;
    }

    const fromIndex = assigned.findIndex((question) => question.id === draggingId);

    if (fromIndex !== -1 && fromIndex !== overIndex) {
      reorderTemplateQuestion(template.id, fromIndex, overIndex);
    }
  };

  return (
    <div>
      <ViewHeader
        title={template.name}
        subtitle="The questions in this template, in the order they are shown."
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Icon name={Icons.PLUS} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={() => {
              setIsAddOpen(true);
            }}
          >
            Add questions
          </Button>
        }
      />

      <div className="mb-6 max-w-md">
        <PrototypeTextField
          label="Template name"
          value={template.name}
          onChange={(value) => {
            renameTemplate(template.id, value);
          }}
        />
      </div>

      <div className="max-w-2xl">
        <Text styleProps={{ weight: 'semibold' }}>Questions ({assigned.length})</Text>
        <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mt-0.5">
          Drag a question by its handle to reorder.
        </Text>
        <div className="mt-3 space-y-2">
          {assigned.map((question, index) => (
            <div
              key={question.id}
              draggable
              onDragStart={() => {
                setDraggingId(question.id);
              }}
              onDragEnter={() => {
                handleDragEnter(index);
              }}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDragEnd={() => {
                setDraggingId(null);
              }}
              onDrop={() => {
                setDraggingId(null);
              }}
              className={`flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow ${
                draggingId === question.id ? 'opacity-50 ring-1 ring-primary' : ''
              }`}
            >
              <span
                className="cursor-grab text-muted-foreground active:cursor-grabbing"
                aria-hidden
              >
                <Icon
                  name={Icons.GRIPVERTICAL}
                  styleProps={{ size: 'sm', colour: 'currentColor' }}
                />
              </span>
              <div className="min-w-0 flex-1">
                <Text styleProps={{ size: 'sm', weight: 'medium' }}>{question.questionText}</Text>
                <div className="mt-0.5">
                  <QuestionTypeBadge type={question.type} />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  unassignQuestion(template.id, question.id);
                }}
              >
                Remove
              </Button>
            </div>
          ))}

          {assigned.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
              <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                No questions yet. Use “Add questions” to build this template.
              </Text>
            </div>
          )}
        </div>
      </div>

      <AddQuestionsModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
        }}
        availableQuestions={available}
        onConfirm={handleAdd}
      />
    </div>
  );
};
