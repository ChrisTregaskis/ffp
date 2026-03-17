import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { TemplatePhaseWithSessions } from '@ffp/core';

import { Button } from '@web/components/button';
import { PageState } from '@web/components/feedback/PageState';
import { Icon } from '@web/components/Icon';
import { PageContainer, PageHeader } from '@web/components/layout';
import { DeleteConfirmModal, InlineFormPanel } from '@web/components/programme-templates';
import { PhaseForm } from '@web/components/programme-templates/PhaseForm';
import type { PhaseFormValues } from '@web/components/programme-templates/PhaseForm';
import { Table, createColumns } from '@web/components/table';
import type { RowAction } from '@web/components/table';
import { Text } from '@web/components/text';
import {
  useCreatePhaseMutation,
  useDeletePhaseMutation,
  useReorderPhasesMutation,
  useTemplateDetailQuery,
  useUpdatePhaseMutation,
} from '@web/hooks/programme-templates';
import { useToast } from '@web/hooks/useToast';
import { RouteKey, routes } from '@web/pages/routes';
import { swapAdjacentItem } from '@web/utils/reorder';

/** Row shape for the phases table */
export type PhaseRow = {
  id: string;
  phaseNumber: number;
  name: string;
  description: string;
  sessionCount: number;
} & Record<string, unknown>;

const toPhaseRow = (phase: TemplatePhaseWithSessions): PhaseRow => ({
  id: phase.id,
  phaseNumber: phase.phaseNumber,
  name: phase.name ?? `Phase ${String(phase.phaseNumber)}`,
  description: phase.description ?? '',
  sessionCount: phase.sessions.length,
});

const columns = createColumns<PhaseRow>();

export const PhasesPage: React.FC = () => {
  const { id: templateId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: template, isLoading, error } = useTemplateDetailQuery(templateId ?? '');

  const createPhase = useCreatePhaseMutation(templateId ?? '');
  const updatePhase = useUpdatePhaseMutation(templateId ?? '');
  const deletePhase = useDeletePhaseMutation(templateId ?? '');
  const reorderPhases = useReorderPhasesMutation(templateId ?? '');

  const isMutating =
    createPhase.isPending ||
    updatePhase.isPending ||
    deletePhase.isPending ||
    reorderPhases.isPending;

  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PhaseRow | null>(null);

  const phases = useMemo(() => template?.phases ?? [], [template?.phases]);

  const phaseRows = useMemo(() => phases.map(toPhaseRow), [phases]);

  // No-op — client-side table, data already loaded
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const handleStateChange = useCallback(() => {}, []);

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_TEMPLATES].path);
  }, [navigate]);

  const handleViewPhase = useCallback(
    (row: PhaseRow) => {
      if (!templateId) {
        return;
      }

      void navigate(`${routes[RouteKey.ADMIN_TEMPLATES].path}/${templateId}/phases/${row.id}`);
    },
    [navigate, templateId]
  );

  const handleReorder = useCallback(
    (row: PhaseRow, direction: 'up' | 'down') => {
      if (!templateId) {
        return;
      }

      const reordered = swapAdjacentItem(
        phases.map((p) => p.id),
        row.id,
        direction
      );

      if (!reordered) {
        return;
      }

      reorderPhases.mutate(
        { templateId, orderedIds: reordered },
        {
          onSuccess: () => addToast('Phase order updated', { variant: 'success' }),
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [templateId, phases, reorderPhases, addToast]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget || !templateId) {
      return;
    }

    deletePhase.mutate(
      { phaseId: deleteTarget.id, templateId },
      {
        onSuccess: () => {
          addToast('Phase deleted', { variant: 'success' });
          setDeleteTarget(null);
        },
        onError: (err) => addToast(err.message, { variant: 'error' }),
      }
    );
  }, [deleteTarget, templateId, deletePhase, addToast]);

  const handleCreatePhase = useCallback(
    (values: PhaseFormValues) => {
      if (!templateId) {
        return;
      }

      createPhase.mutate(
        {
          templateId,
          data: { name: values.name || null, description: values.description || null },
        },
        {
          onSuccess: () => {
            addToast('Phase created', { variant: 'success' });
            setIsAddingPhase(false);
          },
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [templateId, createPhase, addToast]
  );

  const rowActions = useCallback(
    (row: PhaseRow): RowAction<PhaseRow>[] => [
      {
        label: 'Edit Phase',
        onClick: handleViewPhase,
      },
      {
        label: 'Move Up',
        onClick: (r) => {
          handleReorder(r, 'up');
        },
        disabled: () => row.phaseNumber === 1 || isMutating,
      },
      {
        label: 'Move Down',
        onClick: (r) => {
          handleReorder(r, 'down');
        },
        disabled: () => row.phaseNumber === phaseRows.length || isMutating,
      },
      {
        label: 'Delete',
        onClick: (r) => {
          setDeleteTarget(r);
        },
        variant: 'danger',
      },
    ],
    [handleViewPhase, handleReorder, isMutating, phaseRows.length]
  );

  const phaseColumns = useMemo(
    () => [
      columns.number('phaseNumber', { label: 'Order', align: 'center' }),
      columns.text('name', { label: 'Name' }),
      columns.text('description', { label: 'Description' }),
      columns.number('sessionCount', { label: 'Sessions', align: 'center' }),
      columns.actions({ actions: rowActions }),
    ],
    [rowActions]
  );

  return (
    <PageContainer>
      <PageHeader
        title={template ? `${template.name} — Phases` : 'Phases'}
        actions={
          <Button
            variant="primary"
            icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={() => {
              setIsAddingPhase(true);
            }}
            disabled={isMutating}
          >
            Add Phase
          </Button>
        }
      />

      {(isLoading || error) && (
        <PageState
          isLoading={isLoading}
          title="Unable to load template phases"
          message={error?.message}
          actionLabel="Back to Programme Templates"
          onAction={handleNavigateBack}
        />
      )}

      {template && (
        <>
          {isAddingPhase && (
            <InlineFormPanel title="New Phase">
              <PhaseForm
                onSubmit={handleCreatePhase}
                onCancel={() => {
                  setIsAddingPhase(false);
                }}
                isSubmitting={createPhase.isPending}
                submitLabel="Add Phase"
              />
            </InlineFormPanel>
          )}

          <Table<PhaseRow>
            tableId="template-phases"
            data={phaseRows}
            columns={phaseColumns}
            totalRows={phaseRows.length}
            isLoading={false}
            onStateChange={handleStateChange}
            defaultPageSize={50}
            pageSizeOptions={[50]}
            getRowId={(row) => row.id}
            emptyState={
              <div className="py-6 text-center">
                <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-3">
                  No phases yet. Add the first phase to start building the programme.
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsAddingPhase(true);
                  }}
                >
                  + Add Phase
                </Button>
              </div>
            }
          />
        </>
      )}

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isMutating}
        title="Delete Phase"
        message="This will permanently delete this phase and all sessions and exercises within it. This action cannot be undone."
      />
    </PageContainer>
  );
};
