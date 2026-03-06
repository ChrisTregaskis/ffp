import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button';
import { Card } from '@web/components/Card';
import { StatusResult } from '@web/components/feedback/StatusResult';
import { Icon } from '@web/components/Icon';
import { PageContainer, PageHeader } from '@web/components/layout';
import { RouteKey, routes } from '@web/pages/routes';

export const VideoLibraryPage: React.FC = () => {
  const navigate = useNavigate();

  const handleUploadClick = (): void => {
    void navigate(routes[RouteKey.ADMIN_VIDEO_UPLOAD].path);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Video Library Management"
        subtitle="Manage exercise videos with descriptions, categories, and metadata"
        actions={
          <Button
            variant="primary"
            icon={<Icon name="Upload" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={handleUploadClick}
          >
            Upload Video
          </Button>
        }
      />

      {/* Empty state — placeholder until video list is implemented */}
      <Card>
        <StatusResult
          icon="Video"
          iconColour="var(--color-muted-foreground)"
          iconBg="bg-transparent"
          title="No videos yet"
          description="Upload your first exercise video to start building the video library."
          actions={
            <Button
              variant="secondary"
              icon={<Icon name="Upload" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
              onClick={handleUploadClick}
            >
              Upload Video
            </Button>
          }
        />
      </Card>
    </PageContainer>
  );
};
