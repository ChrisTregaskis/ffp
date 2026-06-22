import { useState } from 'react';

import { Button } from '@web/components/button';

import { STEP_TYPE_LABELS, TEMPLATE_LINKED_STEP_TYPES } from './prototype-labels';
import {
  FLOW_STEP_TYPES,
  type FlowStepType,
  type PrototypeStep,
  type PrototypeTemplate,
} from './prototype-types';
import { PrototypeSelectField } from './PrototypeSelectField';
import { PrototypeTextField } from './PrototypeTextField';

export interface StepDraft {
  type: FlowStepType;
  title: string;
  description: string;
  estimatedMinutes: string;
  templateId: string;
}

interface StepFormPanelProps {
  initial?: PrototypeStep;
  templates: PrototypeTemplate[];
  onSave: (draft: StepDraft) => void;
  onCancel: () => void;
}

const toDraft = (step?: PrototypeStep): StepDraft => ({
  type: step?.type ?? 'questions',
  title: step?.config.title ?? '',
  description: step?.config.description ?? '',
  estimatedMinutes: step?.config.estimatedMinutes ? String(step.config.estimatedMinutes) : '',
  templateId: step?.templateId ?? '',
});

/** Inline add/edit form for a flow step. */
export const StepFormPanel: React.FC<StepFormPanelProps> = ({
  initial,
  templates,
  onSave,
  onCancel,
}) => {
  const [draft, setDraft] = useState<StepDraft>(toDraft(initial));
  const linksTemplate = TEMPLATE_LINKED_STEP_TYPES.includes(draft.type);

  const update = <K extends keyof StepDraft>(key: K, value: StepDraft[K]): void => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">
      <PrototypeSelectField
        label="Step type"
        value={draft.type}
        onChange={(value) => {
          update('type', value as FlowStepType);
        }}
        options={FLOW_STEP_TYPES.map((type) => ({ value: type, label: STEP_TYPE_LABELS[type] }))}
      />
      <PrototypeTextField
        label="Title"
        value={draft.title}
        onChange={(value) => {
          update('title', value);
        }}
        placeholder="e.g. About you"
      />
      <PrototypeTextField
        label="Description"
        value={draft.description}
        onChange={(value) => {
          update('description', value);
        }}
        placeholder="Optional helper text shown on the step"
        textarea
      />
      <PrototypeTextField
        label="Estimated minutes"
        type="number"
        value={draft.estimatedMinutes}
        onChange={(value) => {
          update('estimatedMinutes', value);
        }}
        placeholder="Optional"
      />
      {linksTemplate && (
        <PrototypeSelectField
          label="Linked template"
          value={draft.templateId}
          onChange={(value) => {
            update('templateId', value);
          }}
          options={templates.map((template) => ({ value: template.id, label: template.name }))}
          placeholder="Select a template…"
          hint="Questions and video-assessment steps draw their content from a template."
        />
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            onSave(draft);
          }}
        >
          {initial ? 'Save step' : 'Add step'}
        </Button>
      </div>
    </div>
  );
};
