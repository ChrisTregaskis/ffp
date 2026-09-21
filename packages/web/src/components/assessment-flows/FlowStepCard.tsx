import React, { useCallback, useMemo, useState } from 'react';

import type { AdminFlowStepView } from '@ffp/core';

import { Accordion } from '@web/components/accordion';
import { KebabMenu, reorderableItemActions } from '@web/components/dropdown-menu';
import type { DropdownMenuItem } from '@web/components/dropdown-menu';
import { DeleteConfirmModal } from '@web/components/modal';
import { Text } from '@web/components/text';

import { BranchingRuleBadge } from './BranchingRuleBadge';
import { stepToFormValues } from './flow-step-form-values';
import { STEP_TYPE_LABELS, stepTypeLinksTemplate } from './flow-step-labels';
import { FlowStepDetails } from './FlowStepDetails';
import { FlowStepForm } from './FlowStepForm';

import type { FlowStepFormValues } from './flow-step-form-values';

export interface FlowStepCardProps {
  step: AdminFlowStepView;
  /** Name of the linked template, when the step links one */
  templateName?: string;
  /** Another step sits at the same position, on a parallel branch */
  sharesPosition: boolean;
  /** The flow branches, so nothing can be reordered */
  reorderDisabled: boolean;
  /** Whether this is the first step (disables move up) */
  isFirst: boolean;
  /** Whether this is the last step (disables move down) */
  isLast: boolean;
  onUpdate: (stepPublicId: string, values: FlowStepFormValues) => void;
  onDelete: (stepPublicId: string) => void;
  onMoveUp: (stepPublicId: string) => void;
  onMoveDown: (stepPublicId: string) => void;
  isMutating?: boolean;
}

/** Collapsible card for one step, with its actions menu. */
export const FlowStepCard: React.FC<FlowStepCardProps> = ({
  step,
  templateName,
  sharesPosition,
  reorderDisabled,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isMutating = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const linkedTemplateName = stepTypeLinksTemplate(step.type) ? templateName : undefined;

  const handleToggle = useCallback(() => {
    if (!isEditing) {
      setIsExpanded((prev) => !prev);
    }
  }, [isEditing]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setIsExpanded(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSubmitEdit = useCallback(
    (values: FlowStepFormValues) => {
      onUpdate(step.publicId, values);
      setIsEditing(false);
    },
    [step.publicId, onUpdate]
  );

  const handleConfirmDelete = useCallback(() => {
    onDelete(step.publicId);
    setShowDeleteConfirm(false);
  }, [step.publicId, onDelete]);

  const menuItems: DropdownMenuItem[] = useMemo(
    () =>
      reorderableItemActions({
        onEdit: handleEdit,
        onMoveUp: () => {
          onMoveUp(step.publicId);
        },
        onMoveDown: () => {
          onMoveDown(step.publicId);
        },
        onDelete: () => {
          setShowDeleteConfirm(true);
        },
        isFirst,
        isLast,
        reorderDisabled,
      }),
    [handleEdit, onMoveUp, onMoveDown, step.publicId, reorderDisabled, isFirst, isLast]
  );

  const trigger = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>{step.order}</Text>
      <Text styleProps={{ size: 'sm', weight: 'medium' }} className="truncate">
        {step.config.title}
      </Text>
      <span className="rounded bg-muted px-2 py-0.5">
        <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
          {STEP_TYPE_LABELS[step.type]}
        </Text>
      </span>
      {linkedTemplateName && (
        <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="truncate">
          {linkedTemplateName}
        </Text>
      )}
      <BranchingRuleBadge ruleCount={step.branchingRuleCount} />
      {sharesPosition && (
        <span className="rounded-full bg-info/10 px-2.5 py-0.5">
          <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'info' }}>
            Shares position {step.order}
          </Text>
        </span>
      )}
    </div>
  );

  return (
    <>
      <Accordion
        trigger={trigger}
        actions={<KebabMenu items={menuItems} disabled={isMutating} />}
        expanded={isExpanded}
        onToggle={handleToggle}
        toggleDisabled={isEditing}
      >
        {isEditing ? (
          <FlowStepForm
            initialValues={stepToFormValues(step)}
            onSubmit={handleSubmitEdit}
            onCancel={handleCancelEdit}
            isSubmitting={isMutating}
          />
        ) : (
          <FlowStepDetails step={step} templateName={linkedTemplateName} />
        )}
      </Accordion>

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isMutating}
        title="Delete step"
        message="This step will no longer appear in the flow. Assessments already taken keep their record of it."
      />
    </>
  );
};
