import React, { useCallback, useState } from 'react';

import { Button } from '@web/components/button';
import { Card } from '@web/components/Card';
import { Icon } from '@web/components/Icon';
import { UploadVideoModal } from '@web/components/modal';
import { Text, Title } from '@web/components/text';

export const VideoLibraryPage: React.FC = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleOpenUploadModal = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Title as="h1" colour="foreground" className="mb-1">
            Video Library Management
          </Title>
          <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>
            Manage exercise videos with descriptions, categories, and metadata
          </Text>
        </div>
        <Button
          variant="primary"
          icon={<Icon name="Upload" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
          onClick={handleOpenUploadModal}
        >
          Upload Video
        </Button>
      </div>

      {/* Empty state — placeholder until video list is implemented */}
      <Card>
        <div className="flex flex-col items-center py-12">
          <div className="mb-4">
            <Icon
              name="Video"
              styleProps={{ size: 'xl', colour: 'var(--color-muted-foreground)' }}
            />
          </div>
          <Text styleProps={{ weight: 'medium', size: 'lg' }} className="mb-2">
            No videos yet
          </Text>
          <Text
            as="p"
            styleProps={{ colour: 'muted-foreground' }}
            className="mb-6 max-w-md text-center"
          >
            Upload your first exercise video to start building the video library.
          </Text>
          <Button
            variant="secondary"
            icon={<Icon name="Upload" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={handleOpenUploadModal}
          >
            Upload Video
          </Button>
        </div>
      </Card>

      <UploadVideoModal isOpen={isUploadModalOpen} onClose={handleCloseUploadModal} />
    </div>
  );
};
