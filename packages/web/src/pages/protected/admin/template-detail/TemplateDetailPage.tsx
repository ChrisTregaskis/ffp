import { PageContainer } from '@web/components/layout';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';

import type React from 'react';

/** Placeholder — replaced in FFP-483 with full implementation */
export const TemplateDetailPage: React.FC = () => {
  return (
    <PageContainer>
      <Title as="h1" colour="foreground">
        Template Detail
      </Title>
      <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
        Coming soon — FFP-483.
      </Text>
    </PageContainer>
  );
};
