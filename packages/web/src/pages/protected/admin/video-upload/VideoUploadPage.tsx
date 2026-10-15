import React from 'react';
import { generatePath, useNavigate } from 'react-router-dom';

import {
  Button,
  FileInput,
  Icon,
  ProgressBar,
  Text,
  ContentPanel,
  PageContainer,
  PressableArea,
  Surface,
} from '@web/components/atoms';
import { LoadingState, StaticAlert, StatusResult, PageHeader } from '@web/components/molecules';
import { VideoMetadataForm } from '@web/components/video';
import { useVideoUpload } from '@web/hooks/videos';
import { RouteKey, routes } from '@web/pages/routes';
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
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
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
                    Back to Video Library
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
              <>
                <div className="mb-4 flex items-center justify-between">
                  <Text styleProps={{ weight: 'medium' }}>
                    {uploadProgress === 0 ? 'Preparing upload...' : 'Uploading...'}
                  </Text>
                  <Text styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
                    {String(uploadProgress)}%
                  </Text>
                </div>
                <ProgressBar percent={uploadProgress} />
                {selectedFile && (
                  <Text
                    as="p"
                    styleProps={{ colour: 'muted-foreground', size: 'sm' }}
                    className="mt-3"
                  >
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </Text>
                )}
              </>
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

            {/* Drop zone — shown when no valid file is selected */}
            {!hasValidFile && (
              <PressableArea
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={fileSelection.openFilePicker}
                aria-label="Select video file to upload"
                className={`flex w-full flex-col items-center rounded-lg border-2 border-dashed p-10 transition-colors ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                <span className="mb-3">
                  <Icon
                    name="Upload"
                    styleProps={{
                      size: 'xl',
                      colour: isDragOver ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                    }}
                  />
                </span>
                <Text styleProps={{ weight: 'medium', size: 'lg' }} className="mb-1">
                  {isDragOver ? 'Drop your video here' : 'Drag and drop your video here'}
                </Text>
                <Text styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
                  or click to browse files
                </Text>
                <Text styleProps={{ colour: 'muted-foreground', size: 'xs' }} className="mt-2">
                  MP4 format, up to 500 MB
                </Text>
              </PressableArea>
            )}

            {/* File info card — shown when a valid file is selected */}
            {hasValidFile && selectedFile && (
              <Surface padding="md" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon name="Video" styleProps={{ size: 'md', colour: 'var(--color-primary)' }} />
                  <div>
                    <Text styleProps={{ weight: 'medium' }}>{selectedFile.name}</Text>
                    <Text as="p" styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
                      {formatFileSize(selectedFile.size)} &middot; {selectedFile.type}
                    </Text>
                  </div>
                </div>
                <Button variant="neutral" size="sm" onClick={fileSelection.clearFile}>
                  Remove
                </Button>
              </Surface>
            )}

            <FileInput
              forwardedRef={fileSelection.fileInputRef}
              accept="video/mp4"
              onChange={fileSelection.handleFileInputChange}
              aria-hidden="true"
            />

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
