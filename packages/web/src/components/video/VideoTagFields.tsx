import React from 'react';

import { Text, Title } from '@web/components/atoms';
import { FormCheckboxGroup, FormToggle } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
import { toTagOptions } from '@web/components/tags';
import { useTagCategoriesQuery } from '@web/hooks/tags';

import type { VideoMetadataFormValues } from './types';

export interface VideoTagFieldsProps {
  /** Tag publicIds the video was loaded with, so an inactive one stays listed */
  carriedTagIds: string[];
}

/** The fields the programme builder reads: the essential flag and a tag group per category. */
export const VideoTagFields: React.FC<VideoTagFieldsProps> = ({ carriedTagIds }) => {
  const { control, errors } = useComposableFormContext<VideoMetadataFormValues>();
  const { data: tagCategories, isError } = useTagCategoriesQuery();

  return (
    <div className="mt-6 border-t border-border pt-6">
      <Title as="h3" colour="foreground" className="mb-1">
        Exercise Tags
      </Title>
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-4">
        How programmes find this exercise: by goal, body area, movement and audience.
      </Text>

      <FormToggle
        name="isEssential"
        label="Essential"
        hint="A core exercise, favoured over others that fit the same slot."
        control={control}
      />

      {isError && (
        <Text as="p" styleProps={{ size: 'sm', colour: 'destructive' }} className="mb-4">
          Tags could not be loaded. Reload to try again.
        </Text>
      )}

      {tagCategories?.map((category) => (
        <FormCheckboxGroup
          key={category.slug}
          name={`tags.${category.slug}`}
          label={category.label}
          options={toTagOptions(tagCategories, category.slug, carriedTagIds)}
          control={control}
          errors={errors}
        />
      ))}
    </div>
  );
};
