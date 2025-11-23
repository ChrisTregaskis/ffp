import { AnimatePresence, motion } from 'motion/react';
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
  Backdrop,
  CardTransition,
  type CardTransitionDirection,
  ClickScale,
  type DrawerPosition,
  FadeSlideIn,
  ScaleFade,
  SlideDrawer,
  SlideVertical,
  SlideWidth,
  SpringScale,
} from '@web/components/motion';
import { Text, Title } from '@web/components/text';

/**
 * Motion library showcase page (development only).
 *
 * Demonstrates animation capabilities using the motion library:
 * - Card animations (fade in, slide up, spring)
 * - Card transitions (multi-step flows)
 * - Button click animations (subtle scale effect)
 * - Hover effects
 * - Scale & fade animations (tooltips, popovers)
 * - Drawer panels with backdrop overlays
 * - Width transitions (collapsible sidebars)
 * - Vertical slide animations (sticky headers)
 * - Transition configurations
 *
 * Motion is used throughout the application for smooth, performant animations.
 */
export const MotionShowcasePage = (): JSX.Element => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [direction, setDirection] = useState<CardTransitionDirection>('forward');
  const [showScaleFade, setShowScaleFade] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerPosition, setDrawerPosition] = useState<DrawerPosition>('right');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [headerVisible, setHeaderVisible] = useState<boolean>(true);

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

      {/* Scale & Fade Animation */}
      <ComponentSection title="Scale & Fade">
        <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6">
          Quick, subtle animations for tooltips, popovers, and dropdowns
        </Text>
        <div className="space-y-4">
          <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
            ScaleFade combines opacity and scale transformations for snappy, predictable transitions
          </Text>

          <Button
            variant="primary"
            onClick={() => {
              setShowScaleFade(!showScaleFade);
            }}
          >
            {showScaleFade ? 'Hide' : 'Show'} Popover
          </Button>

          <div className="relative h-32">
            <AnimatePresence>
              {showScaleFade && (
                <ScaleFade className="absolute left-0 top-2">
                  <Card className="w-64">
                    <Text as="p" styleProps={{ size: 'sm' }}>
                      This is a popover with ScaleFade animation. It scales up from 95% whilst
                      fading in, creating a subtle but noticeable effect.
                    </Text>
                  </Card>
                </ScaleFade>
              )}
            </AnimatePresence>
          </div>

          <Card className="mt-6">
            <Title as="h4" className="mb-2">
              Use Cases
            </Title>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Tooltips and popovers</li>
              <li>Dropdown menus</li>
              <li>Quick notifications</li>
              <li>Any content that appears/disappears quickly</li>
            </ul>
          </Card>
        </div>
      </ComponentSection>

      {/* Drawer & Backdrop */}
      <ComponentSection title="Drawer Panels">
        <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6">
          Slide-in panels with backdrop overlay for side menus, filters, and modal content
        </Text>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => {
                setDrawerPosition('right');
                setDrawerOpen(true);
              }}
            >
              Open Right Drawer
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDrawerPosition('left');
                setDrawerOpen(true);
              }}
            >
              Open Left Drawer
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDrawerPosition('top');
                setDrawerOpen(true);
              }}
            >
              Open Top Drawer
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDrawerPosition('bottom');
                setDrawerOpen(true);
              }}
            >
              Open Bottom Drawer
            </Button>
          </div>

          <AnimatePresence>
            {drawerOpen && (
              <>
                <Backdrop
                  onClick={() => {
                    setDrawerOpen(false);
                  }}
                />
                <SlideDrawer
                  position={drawerPosition}
                  className={`fixed z-50 bg-background shadow-lg ${
                    drawerPosition === 'left' || drawerPosition === 'right'
                      ? 'top-0 h-full w-80'
                      : 'left-0 w-full h-64'
                  } ${drawerPosition === 'right' ? 'right-0' : ''} ${drawerPosition === 'left' ? 'left-0' : ''} ${drawerPosition === 'top' ? 'top-0' : ''} ${drawerPosition === 'bottom' ? 'bottom-0' : ''}`}
                >
                  <div className="flex h-full flex-col p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <Title as="h3">
                        Drawer from{' '}
                        {drawerPosition.charAt(0).toUpperCase() + drawerPosition.slice(1)}
                      </Title>
                      <Button
                        variant="neutral"
                        onClick={() => {
                          setDrawerOpen(false);
                        }}
                      >
                        Close
                      </Button>
                    </div>
                    <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
                      This drawer slides in from the {drawerPosition} with a smooth animation. Click
                      the backdrop or the close button to dismiss it.
                    </Text>
                  </div>
                </SlideDrawer>
              </>
            )}
          </AnimatePresence>

          <Card className="mt-6">
            <Title as="h4" className="mb-2">
              Components Used Together
            </Title>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                <strong>Backdrop</strong> - Semi-transparent overlay that blocks interaction and can
                be clicked to close
              </li>
              <li>
                <strong>SlideDrawer</strong> - Animated panel that slides in from any edge (left,
                right, top, bottom)
              </li>
              <li>
                <strong>AnimatePresence</strong> - Handles mount/unmount animations smoothly
              </li>
            </ul>
          </Card>
        </div>
      </ComponentSection>

      {/* Sidebar Width Transition */}
      <ComponentSection title="Width Transitions">
        <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6">
          Smooth width animations for collapsible sidebars and resizable panels
        </Text>
        <div className="space-y-4">
          <Button
            variant="primary"
            onClick={() => {
              setSidebarCollapsed(!sidebarCollapsed);
            }}
          >
            {sidebarCollapsed ? 'Expand' : 'Collapse'} Sidebar
          </Button>

          <div className="flex gap-4">
            <SlideWidth
              isCollapsed={sidebarCollapsed}
              expandedWidth={240}
              collapsedWidth={64}
              className="overflow-hidden rounded-lg border bg-muted"
            >
              <div className="h-48 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-primary" />
                  {!sidebarCollapsed && (
                    <Text as="span" styleProps={{ weight: 'semibold' }}>
                      Menu
                    </Text>
                  )}
                </div>
                <nav className="space-y-2">
                  {['Dashboard', 'Settings', 'Profile'].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded p-2 hover:bg-background"
                    >
                      <div className="h-4 w-4 rounded bg-muted-foreground" />
                      {!sidebarCollapsed && (
                        <Text as="span" styleProps={{ size: 'sm' }}>
                          {item}
                        </Text>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
            </SlideWidth>

            <Card className="flex-1">
              <Title as="h4" className="mb-2">
                Main Content Area
              </Title>
              <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                The sidebar smoothly transitions between expanded (240px) and collapsed (64px)
                states. Content visibility is handled separately with conditional rendering.
              </Text>
            </Card>
          </div>

          <Card className="mt-6">
            <Title as="h4" className="mb-2">
              Use Cases
            </Title>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Collapsible navigation sidebars</li>
              <li>Resizable panels and split views</li>
              <li>Responsive layouts that adapt to screen size</li>
              <li>Filter panels that can be hidden/shown</li>
            </ul>
          </Card>
        </div>
      </ComponentSection>

      {/* Vertical Slide */}
      <ComponentSection title="Vertical Slide">
        <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mb-6">
          Animate vertical position changes for sticky headers, banners, and notifications
        </Text>
        <div className="space-y-4">
          <Button
            variant="primary"
            onClick={() => {
              setHeaderVisible(!headerVisible);
            }}
          >
            {headerVisible ? 'Hide' : 'Show'} Header
          </Button>

          <div className="relative h-32 overflow-hidden rounded-lg border">
            <SlideVertical
              isVisible={headerVisible}
              slideDistance={-80}
              className="absolute left-0 right-0 top-0"
            >
              <div className="bg-primary p-4 text-primary-foreground">
                <Title as="h4" className="text-white">
                  Sticky Header
                </Title>
                <Text as="p" styleProps={{ size: 'sm' }} className="text-white/90">
                  This header slides up and down based on visibility state. Perfect for sticky
                  headers that hide on scroll.
                </Text>
              </div>
            </SlideVertical>

            <div className="p-4 pt-24">
              <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                Main content below the header...
              </Text>
            </div>
          </div>

          <Card className="mt-6">
            <Title as="h4" className="mb-2">
              Use Cases
            </Title>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Sticky headers that hide/show on scroll</li>
              <li>Notification banners that slide down from top</li>
              <li>Action bars that appear on selection</li>
              <li>Any content that needs to slide vertically based on state</li>
            </ul>
          </Card>
        </div>
      </ComponentSection>

      {/* Developer instructions */}
      <div className="mt-8">
        <DeveloperInstructions title="Using Motion in FFP Components">
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
  {/* FFP content */}
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
