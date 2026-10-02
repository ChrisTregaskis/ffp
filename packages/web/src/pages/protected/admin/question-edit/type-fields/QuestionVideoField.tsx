import React, { useCallback } from 'react';
import { useController } from 'react-hook-form';

import type { VideoDetailResponse } from '@ffp/core';

import { FieldError } from '@web/components/atoms/FieldError';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { VideoSelector } from '@web/components/programme-templates/VideoSelector';

import type { QuestionFormValues } from '../types';

const DIRTY = { shouldDirty: true } as const;

/** The video a member watches before recording their result. */
export const QuestionVideoField: React.FC = () => {
  const { control, watch, setValue } = useComposableFormContext<QuestionFormValues>();

  const {
    field: { value: videoId, onChange },
    fieldState: { error },
  } = useController({
    name: 'videoId',
    control,
    rules: { required: 'Choose the video the member watches' },
  });

  const videoTitle = watch('videoTitle');
  const videoPublicId = watch('videoPublicId');
  const isUnresolved = videoId !== '' && videoTitle === '';

  const handleSelect = useCallback(
    (video: VideoDetailResponse): void => {
      onChange(video.id);
      setValue('videoPublicId', video.publicId, DIRTY);
      setValue('videoTitle', video.title, DIRTY);
    },
    [onChange, setValue]
  );

  const handleClear = useCallback((): void => {
    onChange('');
    setValue('videoPublicId', '', DIRTY);
    setValue('videoTitle', '', DIRTY);
  }, [onChange, setValue]);

  return (
    <div className="mb-4">
      {isUnresolved && (
        <StaticAlert
          variant="warning"
          message="The linked video can no longer be found or is not published. Choose another before saving a change to it."
          className="mb-2"
        />
      )}
      <VideoSelector
        onSelect={handleSelect}
        onClear={handleClear}
        selectedVideo={videoTitle ? { publicId: videoPublicId, title: videoTitle } : null}
      />
      {error?.message && <FieldError message={error.message} />}
    </div>
  );
};
