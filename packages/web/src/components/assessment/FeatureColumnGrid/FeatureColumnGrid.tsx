import { IconBadge } from '@web/components/Icon';
import type { IconName } from '@web/components/Icon';
import { Text } from '@web/components/text';

export interface FeatureItem {
  /** Icon to display in the badge */
  icon: IconName;
  /** Feature heading text */
  heading: string;
  /** Feature description text */
  description: string;
}

export interface FeatureColumnGridProps {
  /** Feature items to display (typically 3) */
  features: FeatureItem[];
  /** Heading level for feature titles @default 'h3' */
  headingLevel?: 'h3' | 'h4';
  /** Additional wrapper classes */
  className?: string;
}

/**
 * Responsive 3-column grid of icon badge features.
 *
 * Each column displays an IconBadge, a heading, and a description.
 * Used in assessment intro screens and transition cards to summarise
 * what a section contains.
 */
export const FeatureColumnGrid: React.FC<FeatureColumnGridProps> = ({
  features,
  headingLevel = 'h3',
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-3 ${className}`}>
      {features.map((feature) => (
        <div key={feature.heading} className="flex flex-col items-center text-center">
          <IconBadge name={feature.icon} size="lg" variant="secondary" />
          <Text
            as={headingLevel}
            styleProps={{ weight: 'semibold', colour: 'ffp-navy' }}
            className="mt-3"
          >
            {feature.heading}
          </Text>
          <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-1">
            {feature.description}
          </Text>
        </div>
      ))}
    </div>
  );
};
