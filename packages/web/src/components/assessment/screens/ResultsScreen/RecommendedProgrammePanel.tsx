import { SectionHeader, SectionPanel } from '@web/components/assessment';
import { Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

export interface RecommendedProgrammePanelProps {
  name: string;
  description: string;
}

export const RecommendedProgrammePanel: React.FC<RecommendedProgrammePanelProps> = ({
  name,
  description,
}) => {
  return (
    <SectionPanel variant="tinted" className="flex flex-col">
      <div className="px-5 pt-5 pb-4">
        <SectionHeader icon={Icons.TRENDINGUP} title="Recommended Programme" as="h2" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-8 text-center">
        <Text
          as="h3"
          styleProps={{ size: '2xl', weight: 'bold' }}
          className="bg-linear-to-r from-ffp-primary-blue to-ffp-dark-blue bg-clip-text text-transparent"
        >
          {name}
        </Text>
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-2">
          {description}
        </Text>
      </div>
    </SectionPanel>
  );
};
