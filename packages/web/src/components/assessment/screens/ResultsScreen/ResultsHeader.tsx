import { ASSESSMENT_MOTION } from '@web/components/assessment';
import { IconBadge, Icons } from '@web/components/Icon';
import { FadeSlideIn, SpringScale } from '@web/components/motion';
import { Text } from '@web/components/text';

export interface ResultsHeaderProps {
  description: string;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({ description }) => {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <SpringScale initialScale={0.5}>
        <IconBadge
          name={Icons.CHECKCIRCLE}
          size="lg"
          variant="success"
          appearance="solid"
          shape="circle"
        />
      </SpringScale>
      <FadeSlideIn duration={ASSESSMENT_MOTION.duration.entrance}>
        <div>
          <Text
            as="h1"
            styleProps={{ size: '3xl', weight: 'bold', colour: 'ffp-navy' }}
            className="tracking-tight"
          >
            Assessment Complete!
          </Text>
          <Text as="p" styleProps={{ size: 'lg', colour: 'muted-foreground' }} className="mt-2">
            {description}
          </Text>
        </div>
      </FadeSlideIn>
    </div>
  );
};
