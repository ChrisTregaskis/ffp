import React from 'react';

import type { AdminTag } from '@ffp/core';

import { Badge, Button, Surface, Text } from '@web/components/atoms';

export interface TagRowProps {
  tag: AdminTag;
  onRename: (tag: AdminTag) => void;
  onDeactivate: (tag: AdminTag) => void;
  onReactivate: (tag: AdminTag) => void;
  /** An activation change is in flight */
  isBusy?: boolean;
}

/** One tag in its category: label, slug, state and its actions */
export const TagRow: React.FC<TagRowProps> = ({
  tag,
  onRename,
  onDeactivate,
  onReactivate,
  isBusy = false,
}) => (
  <Surface padding="row" className="flex flex-wrap items-center justify-between gap-3">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <Text styleProps={{ weight: 'medium', colour: 'foreground' }}>{tag.label}</Text>
        {!tag.isActive && <Badge label="Inactive" variant="muted" />}
      </div>
      <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
        {tag.slug}
      </Text>
    </div>
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          onRename(tag);
        }}
        aria-label={`Rename ${tag.label}`}
      >
        Rename
      </Button>
      {tag.isActive ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onDeactivate(tag);
          }}
          disabled={isBusy}
          aria-label={`Deactivate ${tag.label}`}
        >
          Deactivate
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onReactivate(tag);
          }}
          disabled={isBusy}
          aria-label={`Reactivate ${tag.label}`}
        >
          Reactivate
        </Button>
      )}
    </div>
  </Surface>
);
