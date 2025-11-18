import { motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@web/components/button/Button';
import { Card } from '@web/components/Card/Card';
import {
  ComponentPageHeader,
  ComponentPageWrapper,
  ComponentSection,
  DeveloperInstructions,
} from '@web/components/dev';
import {
  CardTransition,
  type CardTransitionDirection,
  ClickScale,
  FadeSlideIn,
  SpringScale,
} from '@web/components/motion';
import { Text, Title } from '@web/components/text';

/**
 * Motion library showcase page (development only).
 *
 * Demonstrates animation capabilities using the motion library:
 * - Card animations (fade in, slide up)
 * - Card transitions (multi-step flows)
 * - Button click animations (subtle scale effect)
 * - Hover effects
 * - Transition configurations
 *
 * Motion is used throughout the application for smooth, performant animations.
 */
export const MotionShowcasePage = (): JSX.Element => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [direction, setDirection] = useState<CardTransitionDirection>('forward');

  return (
    <ComponentPageWrapper>
      <ComponentPageHeader
        title="Motion Showcase"
        description="Animation library demonstrations for smooth, performant UI transitions"
        showBackLink
      />

      {/* Card Animations */}
      <ComponentSection title="Card Animations">
        <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6">
          Animate card entry with fade-in and slide-up effects
        </Text>
        <div className="space-y-6">
          <div>
            <Title as="h3" className="mb-3">
              Basic Fade & Slide
            </Title>
            <FadeSlideIn>
              <Card title="Animated Card" subtitle="Fades in and slides up on mount">
                <Text as="p">
                  This card animates in with a fade and slide-up effect. The animation runs when the
                  component mounts.
                </Text>
              </Card>
            </FadeSlideIn>
          </div>

          <div>
            <Title as="h3" className="mb-3">
              Staggered Cards
            </Title>
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <FadeSlideIn key={index} delay={index * 0.1}>
                  <Card title={`Card ${String(index + 1)}`}>
                    <Text as="p" styleProps={{ size: 'sm' }}>
                      Staggered animation with {String(index * 100)}ms delay
                    </Text>
                  </Card>
                </FadeSlideIn>
              ))}
            </div>
          </div>

          <div>
            <Title as="h3" className="mb-3">
              Spring Animation
            </Title>
            <SpringScale>
              <Card title="Spring Card" subtitle="Uses spring physics for natural motion">
                <Text as="p">
                  This card uses a spring transition for a more natural, bouncy animation effect.
                </Text>
              </Card>
            </SpringScale>
          </div>
        </div>
      </ComponentSection>

      {/* Card Transitions */}
      <ComponentSection title="Card Transitions">
        <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6">
          Smooth transitions between cards in multi-step flows (wizards, forms, onboarding)
        </Text>
        <div className="space-y-6">
          <div>
            <Title as="h3" className="mb-3">
              Interactive Step Flow
            </Title>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-4">
              Click Previous/Next to see directional animations - cards slide in from the direction
              you&apos;re navigating
            </Text>

            <CardTransition transitionKey={`step-${String(currentStep)}`} direction={direction}>
              <Card
                title={`Step ${String(currentStep)} of 3`}
                subtitle={`This is step ${String(currentStep)} content`}
              >
                <div className="space-y-4">
                  <Text as="p">
                    CardTransition automatically animates in the correct direction based on
                    navigation. Previous slides from left, Next slides from right.
                  </Text>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setDirection('backward');
                        setCurrentStep((prev) => Math.max(1, prev - 1));
                      }}
                      disabled={currentStep === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setDirection('forward');
                        setCurrentStep((prev) => Math.min(3, prev + 1));
                      }}
                      disabled={currentStep === 3}
                    >
                      Next
                    </Button>
                    <Button
                      variant="neutral"
                      onClick={() => {
                        setDirection('forward');
                        setCurrentStep(1);
                      }}
                    >
                      Reset
                    </Button>
                  </div>

                  <div className="mt-4 rounded-lg bg-muted p-3">
                    <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                      <strong>Current direction:</strong> {direction} • <strong>Animation:</strong>{' '}
                      {direction === 'forward'
                        ? 'Slides in from right, exits to left'
                        : 'Slides in from left, exits to right'}
                    </Text>
                  </div>
                </div>
              </Card>
            </CardTransition>
          </div>

          <Card>
            <Title as="h4" className="mb-2">
              Usage Pattern
            </Title>
            <pre className="overflow-x-auto rounded bg-muted p-4 text-sm">
              {`// State to track current step and direction
const [currentStep, setCurrentStep] = useState(1);
const [direction, setDirection] = useState('forward');

// Handle navigation with direction
const goNext = () => {
  setDirection('forward');
  setCurrentStep(prev => prev + 1);
};

const goPrevious = () => {
  setDirection('backward');
  setCurrentStep(prev => prev - 1);
};

// CardTransition handles AnimatePresence and directional animations
<CardTransition
  transitionKey={\`step-\${currentStep}\`}
  direction={direction}
>
  <Card title={\`Step \${currentStep}\`}>
    {/* Step content here */}
  </Card>
</CardTransition>`}
            </pre>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                Set <code className="rounded bg-muted px-1">direction</code> before changing{' '}
                <code className="rounded bg-muted px-1">transitionKey</code>
              </li>
              <li>
                Use <code className="rounded bg-muted px-1">direction=&quot;forward&quot;</code> for
                next/forward navigation (slides from right)
              </li>
              <li>
                Use <code className="rounded bg-muted px-1">direction=&quot;backward&quot;</code>{' '}
                for previous/back navigation (slides from left)
              </li>
              <li>
                AnimatePresence with{' '}
                <code className="rounded bg-muted px-1">mode=&quot;wait&quot;</code> is managed
                internally
              </li>
              <li>Exit animation completes before new content enters</li>
              <li>Perfect for wizards, multi-step forms, and sequential workflows</li>
            </ul>
          </Card>
        </div>
      </ComponentSection>

      {/* Button Click Animation */}
      <ComponentSection title="Button Click Animation">
        <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6">
          Subtle keyboard-style click effect using scale transformation
        </Text>
        <div className="space-y-4">
          <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
            Click the buttons to see a subtle scale-down effect, similar to a physical keyboard key
          </Text>

          <div className="flex flex-wrap gap-4">
            <ClickScale>
              <Button variant="primary">Click Me</Button>
            </ClickScale>

            <ClickScale>
              <Button variant="success">Save Changes</Button>
            </ClickScale>

            <ClickScale>
              <Button variant="destructive">Delete</Button>
            </ClickScale>

            <ClickScale>
              <Button variant="secondary">Cancel</Button>
            </ClickScale>
          </div>

          <Card className="mt-6">
            <Title as="h4" className="mb-2">
              How It Works
            </Title>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                Wrap the Button in a <code className="rounded bg-muted px-1">ClickScale</code>{' '}
                component
              </li>
              <li>
                Uses <code className="rounded bg-muted px-1">whileTap</code> prop internally to
                define the pressed state
              </li>
              <li>Scales down to 0.95 (95% of original size) when clicked</li>
              <li>Quick 0.1s duration creates a snappy, responsive feel</li>
              <li>Automatically returns to original size when released - no cleanup needed</li>
            </ul>
          </Card>
        </div>
      </ComponentSection>

      {/* Hover Animations */}
      <ComponentSection title="Hover Animations">
        <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6">
          Interactive hover effects on components
        </Text>
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card title="Scale on Hover">
              <Text as="p" styleProps={{ size: 'sm' }}>
                Hover over this card to see it scale up smoothly
              </Text>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Card title="Lift on Hover">
              <Text as="p" styleProps={{ size: 'sm' }}>
                Hover over this card to see it lift upwards
              </Text>
            </Card>
          </motion.div>
        </div>
      </ComponentSection>

      {/* Developer instructions */}
      <div className="mt-8">
        <DeveloperInstructions title="Using Motion in Your Components">
          <div className="space-y-4">
            <div>
              <Title as="h4" className="mb-2">
                Basic Usage
              </Title>
              <pre className="overflow-x-auto rounded bg-muted p-4 text-sm">
                {`import { motion } from 'motion/react';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {/* Your content */}
</motion.div>`}
              </pre>
            </div>

            <div>
              <Title as="h4" className="mb-2">
                Transition Types
              </Title>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>
                  <code className="rounded bg-muted px-1">duration</code>: Tween-based animation
                  (linear, easeIn, easeOut)
                </li>
                <li>
                  <code className="rounded bg-muted px-1">spring</code>: Physics-based animation
                  (stiffness, damping)
                </li>
                <li>
                  <code className="rounded bg-muted px-1">delay</code>: Delay before animation
                  starts (useful for staggering)
                </li>
              </ul>
            </div>

            <div>
              <Title as="h4" className="mb-2">
                Common Patterns
              </Title>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>
                  Fade in: <code className="rounded bg-muted px-1">opacity: 0 → 1</code>
                </li>
                <li>
                  Slide up: <code className="rounded bg-muted px-1">y: 20 → 0</code>
                </li>
                <li>
                  Scale: <code className="rounded bg-muted px-1">scale: 0.8 → 1</code>
                </li>
                <li>
                  Click effect:{' '}
                  <code className="rounded bg-muted px-1">
                    whileTap=&#123;&#123; scale: 0.95 &#125;&#125;
                  </code>
                </li>
                <li>
                  Hover effect:{' '}
                  <code className="rounded bg-muted px-1">
                    whileHover=&#123;&#123; scale: 1.05 &#125;&#125;
                  </code>
                </li>
              </ul>
            </div>

            <div>
              <Title as="h4" className="mb-2">
                Documentation
              </Title>
              <Text as="p" styleProps={{ size: 'sm' }}>
                For more examples and API documentation, visit{' '}
                <a
                  href="https://motion.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  motion.dev
                </a>
              </Text>
            </div>
          </div>
        </DeveloperInstructions>
      </div>
    </ComponentPageWrapper>
  );
};
