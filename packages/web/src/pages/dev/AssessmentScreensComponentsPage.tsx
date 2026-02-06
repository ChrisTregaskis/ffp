import type { FlowStepConfig } from '@ffp/core';

import { IntroScreen, TransitionScreen } from '@web/components/assessment';
import { DemoTabs, type DemoTab } from '@web/components/demo';
import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
} from '@web/components/dev';
import { Text } from '@web/components/text';

// ============================================================================
// Mock flow step configs for demonstrations
// ============================================================================

const mockIntroConfig: FlowStepConfig = {
  title: 'Physiotherapy Assessment',
  description:
    'This assessment will help us understand your current physical condition and create a personalised programme tailored to your needs.',
  estimatedMinutes: 15,
  instructions: [
    'Find a quiet, comfortable space',
    'Wear clothing that allows free movement',
    'Have a glass of water nearby',
    'Allow 15-20 minutes of uninterrupted time',
  ],
};

const mockIntroMinimalConfig: FlowStepConfig = {
  title: 'Quick Health Check',
};

const mockIntroNoInstructionsConfig: FlowStepConfig = {
  title: 'Mobility Assessment',
  description: 'A short assessment to evaluate your current range of motion and flexibility.',
  estimatedMinutes: 10,
};

const mockTransitionConfig: FlowStepConfig = {
  title: 'Physical Assessment',
  description:
    'Great work on the questionnaire! Next, we will guide you through a series of physical tests to assess your strength and balance.',
  estimatedMinutes: 10,
  safetyNotes: [
    'Stop immediately if you experience sharp or sudden pain',
    'Use a sturdy chair or wall for support during balance exercises',
    'Skip any exercise that aggravates an existing injury',
    'Stay hydrated and take breaks between exercises if needed',
  ],
};

const mockTransitionNoSafetyConfig: FlowStepConfig = {
  title: 'Movement Assessment',
  description: 'The next section includes a series of guided movement tests.',
  estimatedMinutes: 8,
};

const mockTransitionMinimalConfig: FlowStepConfig = {
  title: 'Next Section',
};

// Placeholder for screens not yet built
const ComingSoonPlaceholder: React.FC<{ name: string; ticket: string }> = ({ name, ticket }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-4 rounded-full bg-muted p-4">
      <span className="text-2xl">🚧</span>
    </div>
    <Text as="p" styleProps={{ size: 'lg', weight: 'semibold' }}>
      {name}
    </Text>
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-1">
      Coming in {ticket}
    </Text>
  </div>
);

// ============================================================================
// Page Component
// ============================================================================

/**
 * Assessment Screen components showcase page (development only).
 *
 * Demonstrates all step screen components for FFP-140:
 * - IntroScreen (FFP-218)
 * - TransitionScreen (FFP-220) — coming soon
 * - QuestionScreen (FFP-219) — coming soon
 * - ResultsScreen (FFP-221) — coming soon
 * - AssessmentStepRenderer (FFP-222) — coming soon
 */
export const AssessmentScreensComponentsPage = (): JSX.Element => {
  const handleAction = (action: string) => () => {
    // eslint-disable-next-line no-console
    console.log(`[Demo] ${action}`);
  };

  // Top-level tabs — one per screen component
  const screenTabs: DemoTab[] = [
    {
      id: 'intro',
      label: 'IntroScreen',
      content: <IntroScreenDemo onStart={handleAction('onStart called')} />,
    },
    {
      id: 'transition',
      label: 'TransitionScreen',
      content: (
        <TransitionScreenDemo
          onContinue={handleAction('onContinue called')}
          onBack={handleAction('onBack called')}
        />
      ),
    },
    {
      id: 'question',
      label: 'QuestionScreen',
      content: <ComingSoonPlaceholder name="QuestionScreen" ticket="FFP-219" />,
    },
    {
      id: 'results',
      label: 'ResultsScreen',
      content: <ComingSoonPlaceholder name="ResultsScreen" ticket="FFP-221" />,
    },
    {
      id: 'step-renderer',
      label: 'StepRenderer',
      content: <ComingSoonPlaceholder name="AssessmentStepRenderer" ticket="FFP-222" />,
    },
  ];

  return (
    <ComponentPageWrapper maxWidth="7xl">
      <ComponentPageHeader
        title="Assessment Step Screens"
        description="Step screen components for assessment flows (FFP-140)"
        showBackLink
      />

      {/* Implementation Status */}
      <ComponentSection title="Implementation Status">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatusCard title="IntroScreen" status="complete" />
          <StatusCard title="TransitionScreen" status="complete" />
          <StatusCard title="QuestionScreen" status="pending" task="FFP-219" />
          <StatusCard title="ResultsScreen" status="pending" task="FFP-221" />
          <StatusCard title="StepRenderer" status="pending" task="FFP-222" />
        </div>
      </ComponentSection>

      {/* Screen demos */}
      <ComponentSection title="Screen Demos">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Click through each tab to preview the assessment step screens. Each screen receives a{' '}
          <code className="rounded bg-muted px-1">FlowStepConfig</code> and renders its content
          accordingly.
        </Text>
        <DemoTabs tabs={screenTabs} />
      </ComponentSection>

      {/* Developer Instructions */}
      <DeveloperInstructions title="Usage Instructions">
        <div className="space-y-3">
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Import screen components:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { IntroScreen, TransitionScreen } from '@web/components/assessment';`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              FlowStepConfig shape:
            </Text>
            <code className="block whitespace-pre rounded bg-muted p-2 text-xs">
              {`interface FlowStepConfig {
                title: string;
                description?: string;
                instructions?: string[];
                safetyNotes?: string[];
                estimatedMinutes?: number;
              }`}
            </code>
          </div>
        </div>
      </DeveloperInstructions>
    </ComponentPageWrapper>
  );
};

// ============================================================================
// IntroScreen Demo (with variant tabs)
// ============================================================================

const IntroScreenDemo: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const variantTabs: DemoTab[] = [
    {
      id: 'full',
      label: 'Full Config',
      content: <IntroScreen config={mockIntroConfig} onStart={onStart} />,
    },
    {
      id: 'no-instructions',
      label: 'No Instructions',
      content: <IntroScreen config={mockIntroNoInstructionsConfig} onStart={onStart} />,
    },
    {
      id: 'minimal',
      label: 'Minimal',
      content: <IntroScreen config={mockIntroMinimalConfig} onStart={onStart} />,
    },
  ];

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Welcome screen displayed at the start of an assessment flow. Renders title, description,
        estimated duration, preparation checklist, and start button.
      </Text>
      <DemoTabs tabs={variantTabs} />
    </div>
  );
};

// ============================================================================
// TransitionScreen Demo (with variant tabs)
// ============================================================================

const TransitionScreenDemo: React.FC<{ onContinue: () => void; onBack: () => void }> = ({
  onContinue,
  onBack,
}) => {
  const variantTabs: DemoTab[] = [
    {
      id: 'full',
      label: 'Full Config',
      content: (
        <TransitionScreen config={mockTransitionConfig} onContinue={onContinue} onBack={onBack} />
      ),
    },
    {
      id: 'no-safety',
      label: 'No Safety Notes',
      content: (
        <TransitionScreen
          config={mockTransitionNoSafetyConfig}
          onContinue={onContinue}
          onBack={onBack}
        />
      ),
    },
    {
      id: 'minimal',
      label: 'Minimal',
      content: (
        <TransitionScreen
          config={mockTransitionMinimalConfig}
          onContinue={onContinue}
          onBack={onBack}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Transition screen displayed between assessment phases. Shows what to expect next, safety
        warnings from the flow configuration, and navigation buttons.
      </Text>
      <DemoTabs tabs={variantTabs} />
    </div>
  );
};

// ============================================================================
// Helper Components
// ============================================================================

const StatusCard: React.FC<{
  title: string;
  status: 'complete' | 'pending';
  task?: string;
}> = ({ title, status, task }) => {
  const baseClassName = `rounded-lg border p-3 transition-colors ${
    status === 'complete' ? 'border-success/30 bg-success/5' : 'border-border bg-muted/30'
  }`;

  return (
    <div className={baseClassName}>
      <div className="flex items-center justify-between">
        <Text styleProps={{ size: 'sm', weight: 'medium' }}>{title}</Text>
        {status === 'complete' ? (
          <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">Done</span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {task}
          </span>
        )}
      </div>
    </div>
  );
};
