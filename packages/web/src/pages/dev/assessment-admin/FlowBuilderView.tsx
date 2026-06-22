import { useState } from 'react';

import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

import { InfoNote } from './InfoNote';
import { usePrototypeStore } from './PrototypeStore';
import { StatusPill } from './StatusPill';
import { StepCard } from './StepCard';
import { ViewHeader } from './ViewHeader';

/** Flow builder — the step-authoring centrepiece (T3-2). */
export const FlowBuilderView: React.FC<{ flowId: string }> = ({ flowId }) => {
  const { flows, templates, navigate, deleteStep, reorderStep } = usePrototypeStore();
  const flow = flows.find((item) => item.id === flowId);

  const [draggingId, setDraggingId] = useState<string | null>(null);

  if (!flow) {
    return (
      <div>
        <ViewHeader title="Flow not found" />
      </div>
    );
  }

  // Live reorder: as the dragged step hovers a new slot, move it there so the
  // other steps shift to make room.
  const handleDragEnter = (overIndex: number): void => {
    if (draggingId === null) {
      return;
    }

    const fromIndex = flow.steps.findIndex((step) => step.id === draggingId);

    if (fromIndex !== -1 && fromIndex !== overIndex) {
      reorderStep(flow.id, fromIndex, overIndex);
    }
  };

  return (
    <div>
      <ViewHeader
        title={flow.name}
        subtitle="Arrange the steps a member moves through. Drag a step by its handle to reorder."
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Icon name={Icons.PLUS} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={() => {
              navigate({ name: 'step-edit', flowId: flow.id, stepId: 'new' });
            }}
          >
            Add step
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <StatusPill active={flow.isActive} />
        <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          {flow.steps.length} steps · /{flow.publicId}
        </Text>
      </div>

      {flow.steps.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <Text styleProps={{ colour: 'muted-foreground' }}>
            No steps yet. Add the first step to start shaping the flow.
          </Text>
        </div>
      )}

      <div className="space-y-3">
        {flow.steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            templates={templates}
            isDragging={draggingId === step.id}
            onDragStart={() => {
              setDraggingId(step.id);
            }}
            onDragEnter={handleDragEnter}
            onDragEnd={() => {
              setDraggingId(null);
            }}
            onEdit={() => {
              navigate({ name: 'step-edit', flowId: flow.id, stepId: step.id });
            }}
            onDelete={() => {
              deleteStep(flow.id, step.id);
            }}
          />
        ))}
      </div>

      <div className="mt-6">
        <InfoNote>
          Branching rules are shown read-only in this prototype (the “N rules” badge). Editing them
          comes in a later iteration — a linear flow still navigates fine without it.
        </InfoNote>
      </div>
    </div>
  );
};
