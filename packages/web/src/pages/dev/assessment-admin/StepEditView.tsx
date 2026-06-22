import { ContentPanel } from '@web/components/layout';

import { usePrototypeStore } from './PrototypeStore';
import { StepFormPanel, type StepDraft } from './StepFormPanel';
import { ViewHeader } from './ViewHeader';

import type { PrototypeStep } from './prototype-types';

const draftToStepFields = (
  draft: StepDraft
): Pick<PrototypeStep, 'type' | 'templateId' | 'config'> => {
  const minutes = Number.parseInt(draft.estimatedMinutes, 10);

  return {
    type: draft.type,
    templateId: draft.templateId || undefined,
    config: {
      title: draft.title,
      description: draft.description || undefined,
      estimatedMinutes: Number.isNaN(minutes) ? undefined : minutes,
    },
  };
};

interface StepEditViewProps {
  flowId: string;
  /** Step id, or the 'new' sentinel when adding */
  stepId: string;
}

/** Add or edit a single flow step on its own page; saving returns to the builder. */
export const StepEditView: React.FC<StepEditViewProps> = ({ flowId, stepId }) => {
  const { flows, templates, navigate, addStep, updateStep } = usePrototypeStore();
  const flow = flows.find((item) => item.id === flowId);
  const isNew = stepId === 'new';
  const step = flow?.steps.find((item) => item.id === stepId);

  if (!flow || (!isNew && !step)) {
    return <ViewHeader title="Step not found" />;
  }

  const goBack = (): void => {
    navigate({ name: 'flow-builder', flowId });
  };

  const handleSave = (draft: StepDraft): void => {
    if (isNew) {
      addStep(flow.id, { ...draftToStepFields(draft), ruleCount: 0 });
    } else if (step) {
      updateStep(flow.id, { ...step, ...draftToStepFields(draft) });
    }

    goBack();
  };

  return (
    <div>
      <ViewHeader
        title={isNew ? 'Add step' : 'Edit step'}
        subtitle={`${flow.name} — configure the step type, content and linked template.`}
      />
      <ContentPanel>
        <StepFormPanel initial={step} templates={templates} onSave={handleSave} onCancel={goBack} />
      </ContentPanel>
    </div>
  );
};
