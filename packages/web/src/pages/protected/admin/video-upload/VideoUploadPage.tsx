import React from 'react';
import { generatePath, useNavigate } from 'react-router-dom';

import { Button, ContentPanel, PageContainer, Surface } from '@web/components/atoms';
import {
  FileSummary,
  LoadingState,
  StaticAlert,
  StatusResult,
  PageHeader,
  UploadProgress,
} from '@web/components/molecules';
import { VideoFileDropzone, VideoMetadataForm } from '@web/components/video';
import { RouteKey, routes } from '@web/config/routes';
import { useVideoUpload } from '@web/hooks/videos';
import { formatFileSize } from '@web/utils/format';

/**
 * Full-page video upload flow.
 *
 * Shows drop zone and metadata form.
 * On submit: upload to S3 with progress, then create video record.
 * On success: offer "Back to Library" or "Upload Another".
 */
export const VideoUploadPage: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = (): void => {
    void navigate(routes[RouteKey.ADMIN_VIDEOS].path);
  };

  const {
    fileSelection,
    progress,
    handleSubmit,
    handleClose: handleCloseUpload,
    hasValidFile,
  } = useVideoUpload(handleClose);

  const { phase, uploadProgress, submitError, createdVideoId } = progress;
  const { file: selectedFile, validationError: fileValidationError } = fileSelection;
  const showForm = phase === 'idle' || phase === 'error';

  return (
    <PageContainer>
      <PageHeader
        title="Upload New Video"
        subtitle="Add a new exercise video with description, tags, and metadata."
      />

      <ContentPanel>
        {/* Success view */}
        {phase === 'success' && (
          <Surface padding="lg">
            <StatusResult
              icon="CheckCircle"
              iconVariant="success"
              iconAppearance="solid"
              title="Video Created"
              description={`Your video has been created successfully with status "draft".`}
              actions={
                <>
                  <Button variant="secondary" onClick={handleCloseUpload}>
                    Back to Exercises
                  </Button>
                  {createdVideoId && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        void navigate(
                          generatePath(routes[RouteKey.ADMIN_VIDEO_EDIT].path, {
                            id: createdVideoId,
                          })
                        );
                      }}
                    >
                      Set Default Prescription
                    </Button>
                  )}
                </>
              }
            />
          </Surface>
        )}

        {/* Progress view (uploading or creating) */}
        {(phase === 'uploading' || phase === 'creating') && (
          <Surface padding="lg">
            {phase === 'uploading' && (
              <UploadProgress
                percent={uploadProgress}
                caption={
                  selectedFile
                    ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})`
                    : undefined
                }
              />
            )}

            {phase === 'creating' && (
              <div className="py-6">
                <LoadingState layout="fill" message="Creating video record..." />
              </div>
            )}
          </Surface>
        )}

        {/* Form view (idle or error) */}
        {showForm && (
          <>
            {/* Submit error alert */}
            {submitError && <StaticAlert variant="error" message={submitError} className="mb-4" />}

            {!hasValidFile && (
              <VideoFileDropzone
                onFileSelect={fileSelection.selectFile}
                aria-label="Select video file to upload"
              />
            )}

            {hasValidFile && selectedFile && (
              <Surface padding="md">
                <FileSummary
                  file={selectedFile}
                  icon="Video"
                  detail={selectedFile.type}
                  action={
                    <Button variant="neutral" size="sm" onClick={fileSelection.clearFile}>
                      Remove
                    </Button>
                  }
                />
              </Surface>
            )}

            {/* File validation error */}
            {fileValidationError && (
              <StaticAlert
                variant="error"
                message={fileValidationError}
                onDismiss={fileSelection.clearFile}
                className="mt-4"
              />
            )}

            {/* Metadata form with submit button */}
            <VideoMetadataForm
              className="mt-6"
              hasFile={hasValidFile}
              onSubmit={handleSubmit}
              onCancel={handleCloseUpload}
            />
          </>
        )}
      </ContentPanel>
    </PageContainer>
  );
};
