import { useId, useState } from 'react';

import { Button, IconBadge, Icons, Surface, Text } from '@web/components/atoms';
import { StaticAlert } from '@web/components/molecules';
import { FadeSlideIn } from '@web/components/motion';

import { ASSESSMENT_MOTION } from '../../motion.constants';
import { ChoiceOption } from '../../questions/ChoiceOption';

export interface SafetyConsentScreenProps {
  /** The advice the member's answers raised */
  advice: string;
  /** Records the member's confirmation, which releases their result */
  onConfirm: () => void;
  isConfirming: boolean;
  /** Shown when the confirmation could not be saved */
  errorMessage?: string;
}

/**
 * Holds the member's result until they confirm they have spoken to a health
 * professional about the answers that raised the advice. Advice, not a block:
 * ticking the box releases the result.
 */
export const SafetyConsentScreen: React.FC<SafetyConsentScreenProps> = ({
  advice,
  onConfirm,
  isConfirming,
  errorMessage,
}) => {
  const [hasConsented, setHasConsented] = useState(false);
  const consentId = useId();
  const { duration, stagger } = ASSESSMENT_MOTION;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <FadeSlideIn duration={duration.entrance}>
        <div className="flex flex-col items-center gap-4 text-center">
          <IconBadge name={Icons.HEART} size="lg" variant="primary" shape="circle" />
          <Text
            as="h1"
            styleProps={{ size: '3xl', weight: 'bold', colour: 'ffp-navy' }}
            className="tracking-tight"
          >
            One step before your results
          </Text>
        </div>
      </FadeSlideIn>

      <FadeSlideIn delay={stagger.second} duration={duration.entrance}>
        <Surface as="section" variant="section" padding="lg" className="space-y-4">
          <Text as="p" styleProps={{ size: 'lg', weight: 'medium' }}>
            {advice}
          </Text>
          <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
            Your results will be waiting for you. Once you have spoken to a health professional,
            tick the box below to see them.
          </Text>
          <ChoiceOption
            type="checkbox"
            id={consentId}
            name="safety-consent"
            value="consented"
            label="I have spoken to a health professional"
            isSelected={hasConsented}
            hasError={false}
            disabled={isConfirming}
            onSelect={() => {
              setHasConsented((consented) => !consented);
            }}
          />
        </Surface>
      </FadeSlideIn>

      {errorMessage && <StaticAlert variant="error" appearance="soft" message={errorMessage} />}

      <FadeSlideIn delay={stagger.third} duration={duration.entrance} slideDistance={0}>
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={onConfirm}
            disabled={!hasConsented}
            loading={isConfirming}
          >
            See my results
          </Button>
        </div>
      </FadeSlideIn>
    </div>
  );
};
