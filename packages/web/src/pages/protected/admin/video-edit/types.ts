import type { VideoMetadataFormValues } from '@web/components/form/videos/types';

/** Form values for the video edit form — extends upload form with status */
export interface VideoEditFormValues extends VideoMetadataFormValues {
  status: string;
}
