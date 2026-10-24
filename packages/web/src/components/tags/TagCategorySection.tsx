import React, { useCallback, useState } from 'react';

import type { AdminTag, AdminTagCategory } from '@ffp/core';

import { Button, Surface, Text, Title } from '@web/components/atoms';
import { InlineFormPanel } from '@web/components/molecules';
import { useCreateTagMutation, useUpdateTagMutation } from '@web/hooks/tags';
import { useToast } from '@web/hooks/useToast';

import {
  isTakenSlug,
  toCreateTagInput,
  toTagFormValues,
  toUpdateTagInput,
} from './tag-form-values';
import { TagForm } from './TagForm';
import { TagRow } from './TagRow';

import type { TagFormValues } from './tag-form-values';

export interface TagCategorySectionProps {
  category: AdminTagCategory;
  onDeactivate: (tag: AdminTag) => void;
  onReactivate: (tag: AdminTag) => void;
  isChangingActivation?: boolean;
}

/** A tag category with its tags, and the inline forms to add or rename one */
export const TagCategorySection: React.FC<TagCategorySectionProps> = ({
  category,
  onDeactivate,
  onReactivate,
  isChangingActivation = false,
}) => {
  const { addToast } = useToast();
  const createTag = useCreateTagMutation();
  const updateTag = useUpdateTagMutation();
  const [isAdding, setIsAdding] = useState(false);
  const [renaming, setRenaming] = useState<AdminTag | null>(null);
  const [takenSlug, setTakenSlug] = useState<string | undefined>();

  const handleStartAdd = useCallback(() => {
    setRenaming(null);
    setTakenSlug(undefined);
    setIsAdding(true);
  }, []);

  const handleStartRename = useCallback((tag: AdminTag) => {
    setIsAdding(false);
    setRenaming(tag);
  }, []);

  const handleCreate = useCallback(
    (values: TagFormValues) => {
      setTakenSlug(undefined);
      const input = toCreateTagInput(values, category.slug);
      createTag.mutate(input, {
        onSuccess: (tag) => {
          addToast(`"${tag.label}" added to ${category.label}`, { variant: 'success' });
          setIsAdding(false);
        },
        // The form stays open with what was typed, so a fix is one edit away
        onError: (err) => {
          if (isTakenSlug(err)) {
            setTakenSlug(input.slug);
          } else {
            addToast(err.message, { variant: 'error' });
          }
        },
      });
    },
    [createTag, category, addToast]
  );

  const handleRename = useCallback(
    (values: TagFormValues) => {
      if (!renaming) {
        return;
      }

      const data = toUpdateTagInput(values, renaming);

      if (Object.keys(data).length === 0) {
        setRenaming(null);

        return;
      }

      updateTag.mutate(
        { publicId: renaming.publicId, data },
        {
          onSuccess: (tag) => {
            addToast(`Renamed to "${tag.label}"`, { variant: 'success' });
            setRenaming(null);
          },
          onError: (err) => {
            addToast(err.message, { variant: 'error' });
          },
        }
      );
    },
    [renaming, updateTag, addToast]
  );

  return (
    <section aria-label={category.label}>
      <Surface variant="elevated" padding="lg">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Title as="h2" colour="foreground">
              {category.label}
            </Title>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              {category.tags.length === 1 ? '1 tag' : `${String(category.tags.length)} tags`}
            </Text>
          </div>
          <Button variant="secondary" size="sm" onClick={handleStartAdd} disabled={isAdding}>
            Add tag
          </Button>
        </div>

        {isAdding && (
          <InlineFormPanel title={`New ${category.label} tag`}>
            <TagForm
              onSubmit={handleCreate}
              onCancel={() => {
                setIsAdding(false);
              }}
              isSubmitting={createTag.isPending}
              takenSlug={takenSlug}
            />
          </InlineFormPanel>
        )}

        {renaming && (
          <InlineFormPanel title={`Rename "${renaming.label}"`}>
            <TagForm
              // A fresh form per tag, so switching rows re-seeds it
              key={renaming.publicId}
              initialValues={toTagFormValues(renaming)}
              onSubmit={handleRename}
              onCancel={() => {
                setRenaming(null);
              }}
              isSubmitting={updateTag.isPending}
            />
          </InlineFormPanel>
        )}

        {category.tags.length === 0 ? (
          <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            No {category.label.toLowerCase()} tags yet.
          </Text>
        ) : (
          <div className="flex flex-col gap-2">
            {category.tags.map((tag) => (
              <TagRow
                key={tag.publicId}
                tag={tag}
                onRename={handleStartRename}
                onDeactivate={onDeactivate}
                onReactivate={onReactivate}
                isBusy={isChangingActivation}
              />
            ))}
          </div>
        )}
      </Surface>
    </section>
  );
};
