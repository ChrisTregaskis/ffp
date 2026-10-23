import React, { useCallback, useMemo, useState } from 'react';

import { SESSION_SLOT_LIMITS } from '@ffp/core';
import type { SlotResponse } from '@ffp/core';

import { Button, Icon, LoadingSpinner, Text } from '@web/components/atoms';
import { ErrorRetryState, InlineFormPanel, StaticAlert } from '@web/components/molecules';
import { DeleteConfirmModal } from '@web/components/organisms';
import {
  useCreateSlotMutation,
  useDeleteSlotMutation,
  useReorderSlotsMutation,
  useSessionSlotsQuery,
  useUpdateSlotMutation,
} from '@web/hooks/programme-templates';
import { useToast } from '@web/hooks/useToast';
import { swapAdjacentItem } from '@web/utils/reorder';

import { slotToFormValues, toCreateSlotRequest, toUpdateSlotRequest } from './slot-form-values';
import { SlotForm } from './SlotForm';
import { SlotRow } from './SlotRow';

import type { SlotFormValues } from './slot-form-values';

export interface SlotListProps {
  /** Session ID to fetch and manage slots for */
  sessionId: string;
}

/** Container for slot CRUD within a session: fetches slots and manages mutations. */
export const SlotList: React.FC<SlotListProps> = ({ sessionId }) => {
  const { addToast } = useToast();
  const { data, isPending, isError, refetch } = useSessionSlotsQuery(sessionId);

  const createSlot = useCreateSlotMutation();
  const updateSlot = useUpdateSlotMutation();
  const deleteSlot = useDeleteSlotMutation();
  const reorderSlots = useReorderSlotsMutation();

  const isMutating =
    createSlot.isPending || updateSlot.isPending || deleteSlot.isPending || reorderSlots.isPending;

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SlotResponse | null>(null);

  const slots = useMemo(() => data?.slots ?? [], [data]);
  const isFull = slots.length >= SESSION_SLOT_LIMITS.max;

  const handleCreate = useCallback(
    (values: SlotFormValues) => {
      createSlot.mutate(
        { sessionId, data: toCreateSlotRequest(values) },
        {
          onSuccess: () => {
            addToast('Slot added', { variant: 'success' });
            setIsAdding(false);
          },
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [sessionId, createSlot, addToast]
  );

  const handleUpdate = useCallback(
    (slot: SlotResponse, values: SlotFormValues) => {
      const payload = toUpdateSlotRequest(values, slot);

      if (Object.keys(payload).length === 0) {
        setEditingId(null);

        return;
      }

      updateSlot.mutate(
        { publicId: slot.publicId, data: payload },
        {
          onSuccess: () => {
            addToast('Slot updated', { variant: 'success' });
            setEditingId(null);
          },
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [updateSlot, addToast]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) {
      return;
    }

    deleteSlot.mutate(
      { publicId: deleteTarget.publicId },
      {
        onSuccess: () => {
          addToast('Slot removed', { variant: 'success' });
          setDeleteTarget(null);
        },
        onError: (err) => addToast(err.message, { variant: 'error' }),
      }
    );
  }, [deleteTarget, deleteSlot, addToast]);

  const handleReorder = useCallback(
    (publicId: string, direction: 'up' | 'down') => {
      const reordered = swapAdjacentItem(
        slots.map((slot) => slot.publicId),
        publicId,
        direction
      );

      if (!reordered) {
        return;
      }

      reorderSlots.mutate(
        { sessionId, orderedIds: reordered },
        {
          onSuccess: () => addToast('Slot order updated', { variant: 'success' }),
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [sessionId, slots, reorderSlots, addToast]
  );

  // Pending, not loading: a paused retry would otherwise read as "No slots yet"
  if (isPending) {
    return (
      <div className="py-2">
        <LoadingSpinner size="sm" variant="center" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorRetryState
        title="We couldn't load this session's slots just now."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <>
      {data.hasTooFewSlots && (
        <StaticAlert
          variant="warning"
          appearance="soft"
          message={`This session has ${String(slots.length)} of the ${String(SESSION_SLOT_LIMITS.min)} to ${String(SESSION_SLOT_LIMITS.max)} slots a session is meant to have.`}
          className="mb-2"
        />
      )}

      {slots.length > 0 && (
        <div className="space-y-2">
          {slots.map((slot, index) =>
            editingId === slot.publicId ? (
              <InlineFormPanel key={slot.publicId} title="Edit Slot">
                <SlotForm
                  initialValues={slotToFormValues(slot)}
                  onSubmit={(values) => {
                    handleUpdate(slot, values);
                  }}
                  onCancel={() => {
                    setEditingId(null);
                  }}
                  isSubmitting={updateSlot.isPending}
                />
              </InlineFormPanel>
            ) : (
              <SlotRow
                key={slot.publicId}
                slot={slot}
                isFirst={index === 0}
                isLast={index === slots.length - 1}
                onEdit={setEditingId}
                onDelete={(publicId) => {
                  setDeleteTarget(
                    slots.find((candidate) => candidate.publicId === publicId) ?? null
                  );
                }}
                onMoveUp={(publicId) => {
                  handleReorder(publicId, 'up');
                }}
                onMoveDown={(publicId) => {
                  handleReorder(publicId, 'down');
                }}
                isMutating={isMutating}
              />
            )
          )}
        </div>
      )}

      {slots.length === 0 && !isAdding && (
        <Text
          as="p"
          styleProps={{ size: 'sm', colour: 'muted-foreground' }}
          className="py-2 text-center"
        >
          No slots yet
        </Text>
      )}

      {isAdding && (
        <InlineFormPanel title="New Slot">
          <SlotForm
            onSubmit={handleCreate}
            onCancel={() => {
              setIsAdding(false);
            }}
            isSubmitting={createSlot.isPending}
            submitLabel="Add Slot"
          />
        </InlineFormPanel>
      )}

      {!isAdding && !editingId && (
        <div className="mt-2 flex items-center justify-end gap-3">
          {isFull && (
            <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
              A session holds at most {String(SESSION_SLOT_LIMITS.max)} slots
            </Text>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={() => {
              setIsAdding(true);
            }}
            disabled={isMutating || isFull}
          >
            Add Slot
          </Button>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={deleteSlot.isPending}
        title="Remove Slot"
        message="This will remove the slot from the session. Programmes already built keep their exercises."
      />
    </>
  );
};
