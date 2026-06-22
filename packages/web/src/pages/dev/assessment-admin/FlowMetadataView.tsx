import { useState } from 'react';

import { ComposableForm } from '@web/components/form/composableForm/Form';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { ContentPanel } from '@web/components/layout';

import { FlowMetaFields, type FlowMetaValues } from './FlowMetaFields';
import { usePrototypeStore } from './PrototypeStore';
import { ToggleSwitch } from './ToggleSwitch';
import { ViewHeader } from './ViewHeader';

interface FlowMetadataViewProps {
  /** Flow id, or the 'new' sentinel when creating */
  flowId: string;
}

/** Create or edit a flow's metadata (name, description, active state). */
export const FlowMetadataView: React.FC<FlowMetadataViewProps> = ({ flowId }) => {
  const { flows, navigate, createFlow, updateFlowMeta } = usePrototypeStore();
  const existing = flowId === 'new' ? undefined : flows.find((flow) => flow.id === flowId);
  const isNew = flowId === 'new';

  const [isActive, setIsActive] = useState(existing?.isActive ?? false);

  const handleSubmit = (values: FlowMetaValues): void => {
    if (isNew) {
      const created = createFlow({ ...values, isActive });
      navigate({ name: 'flow-builder', flowId: created.id });

      return;
    }

    if (existing) {
      updateFlowMeta(existing.id, { ...values, isActive });
      navigate({ name: 'flows' });
    }
  };

  return (
    <div>
      <ViewHeader
        title={isNew ? 'New flow' : 'Edit flow'}
        subtitle={
          isNew
            ? 'Give the flow a name — you can add steps once it is created.'
            : 'Update how this flow is described and whether it is active.'
        }
      />

      <ContentPanel>
        <ComposableForm<FlowMetaValues>
          onSubmit={handleSubmit}
          defaultValues={{ name: existing?.name ?? '', description: existing?.description ?? '' }}
          className="space-y-5"
        >
          <FlowMetaFields />
          <ToggleSwitch
            checked={isActive}
            onChange={setIsActive}
            label="Active"
            hint="Active flows are available to members. Drafts stay hidden."
          />
          <FormActions
            onCancel={() => {
              navigate({ name: 'flows' });
            }}
            submitLabel={isNew ? 'Create flow' : 'Save changes'}
          />
        </ComposableForm>
      </ContentPanel>
    </div>
  );
};
