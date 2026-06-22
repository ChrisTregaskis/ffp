import { DropdownMenu } from '@web/components/dropdown-menu';
import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

import { iconVar, STEP_TYPE_LABELS } from './prototype-labels';

import type { PrototypeStep, PrototypeTemplate } from './prototype-types';

interface StepCardProps {
  step: PrototypeStep;
  index: number;
  templates: PrototypeTemplate[];
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** A single step in the flow builder — draggable, with an Actions menu. */
export const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  templates,
  isDragging,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onEdit,
  onDelete,
}) => {
  const template = templates.find((item) => item.id === step.templateId);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={() => {
        onDragEnter(index);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragEnd={onDragEnd}
      onDrop={onDragEnd}
      className={`flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow ${
        isDragging ? 'opacity-50 ring-1 ring-primary' : ''
      }`}
    >
      <span className="cursor-grab text-muted-foreground active:cursor-grabbing" aria-hidden>
        <Icon name={Icons.GRIPVERTICAL} styleProps={{ size: 'sm', colour: 'currentColor' }} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Text styleProps={{ weight: 'semibold' }}>{step.config.title || 'Untitled step'}</Text>
          <span className="rounded bg-muted px-2 py-0.5">
            <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
              {STEP_TYPE_LABELS[step.type]}
            </Text>
          </span>
          {step.ruleCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-info/10 px-2.5 py-0.5">
              <Icon name={Icons.REPEAT} styleProps={{ size: 'xs', colour: iconVar('info') }} />
              <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'info' }}>
                {step.ruleCount} {step.ruleCount === 1 ? 'rule' : 'rules'}
              </Text>
            </span>
          )}
        </div>
        {template && (
          <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            Template: {template.name}
          </Text>
        )}
      </div>

      <div className="shrink-0">
        <DropdownMenu
          label="Actions"
          size="sm"
          items={[
            { label: 'Edit', onClick: onEdit },
            { label: 'Delete', onClick: onDelete, variant: 'danger' },
          ]}
        />
      </div>
    </div>
  );
};
