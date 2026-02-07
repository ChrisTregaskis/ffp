import { useState } from 'react';

import type { AnswerValue, AssessmentQuestion, FlowStepConfig } from '@ffp/core';

import {
  IntroScreen,
  QuestionCard,
  TransitionCard,
  VideoQuestionCard,
} from '@web/components/assessment';
import { Button } from '@web/components/button';
import { DemoTabs, type DemoTab } from '@web/components/demo';
import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
} from '@web/components/dev';
import { Icon, Icons } from '@web/components/Icon';
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
  title: 'Ready for Physical Assessment?',
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
  title: 'Ready for Movement Assessment?',
  description: 'The next section includes a series of guided movement tests.',
  estimatedMinutes: 8,
};

const mockTransitionMinimalConfig: FlowStepConfig = {
  title: 'Ready for Next Section',
};

const mockQuestionStepConfig: FlowStepConfig = {
  title: 'Pre-Assessment Questions',
  description: 'Help us understand your current condition and goals.',
};

const mockVideoStepConfig: FlowStepConfig = {
  title: 'Physical Assessment',
  description: 'Follow the video instructions and record your result.',
  instructions: [
    'Watch the full video before attempting the exercise',
    'Use a sturdy chair or wall for support if needed',
    'Record the number of repetitions you can complete',
  ],
};

const mockSingleChoiceQuestion: AssessmentQuestion = {
  id: '00000000-0000-0000-0000-000000000001',
  type: 'single-choice',
  question: 'What is your primary goal for this programme?',
  description: 'Select the option that best describes what you hope to achieve.',
  options: [
    { value: 'reduce_pain', label: 'Reduce pain and discomfort' },
    { value: 'improve_mobility', label: 'Improve mobility and flexibility' },
    { value: 'build_strength', label: 'Build strength and endurance' },
    { value: 'prevent_injury', label: 'Prevent future injuries' },
  ],
};

const mockScaleQuestion: AssessmentQuestion = {
  id: '00000000-0000-0000-0000-000000000002',
  type: 'scale',
  question: 'How would you rate your current pain level?',
  description: 'On a scale from 0 (no pain) to 10 (worst imaginable pain).',
  validation: { required: true, min: 0, max: 10 },
};

const mockTextQuestion: AssessmentQuestion = {
  id: '00000000-0000-0000-0000-000000000003',
  type: 'text',
  question: 'Please describe any previous injuries or conditions.',
  description: 'Include any relevant medical history that may affect your assessment.',
  validation: { required: false, max: 500 },
};

const mockVideoQuestion: AssessmentQuestion = {
  id: '00000000-0000-0000-0000-000000000004',
  type: 'video-response',
  question: 'How many sit-to-stand repetitions can you complete in 30 seconds?',
  description: 'Watch the demonstration video, then perform the exercise and enter your count.',
  validation: { required: true, min: 0, max: 50 },
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

// Mock footer for dev demos (avoids needing AssessmentProvider context)
const MockFooter: React.FC = () => (
  <nav className="flex items-center justify-between" aria-label="Assessment navigation">
    <Button
      variant="secondary"
      onClick={() => {
        // eslint-disable-next-line no-console
        console.log('[Demo] Back clicked');
      }}
      icon={<Icon name={Icons.CHEVRONLEFT} styleProps={{ size: 'sm' }} />}
    >
      Back
    </Button>
    <Button
      variant="primary"
      onClick={() => {
        // eslint-disable-next-line no-console
        console.log('[Demo] Continue clicked');
      }}
      icon={<Icon name={Icons.CHEVRONRIGHT} styleProps={{ size: 'sm' }} />}
      iconPosition="right"
    >
      Continue
    </Button>
  </nav>
);

// ============================================================================
// Page Component
// ============================================================================

/**
 * Assessment Screen components showcase page (development only).
 *
 * Demonstrates all step components for FFP-140:
 * - IntroScreen (FFP-218) — standalone screen
 * - QuestionCard (FFP-219) — card layout
 * - TransitionCard (FFP-220) — card layout
 * - VideoQuestionCard — card layout scaffold
 * - ResultsScreen (FFP-221) — coming soon
 * - AssessmentStepRenderer (FFP-222) — coming soon
 */
export const AssessmentScreensComponentsPage = (): JSX.Element => {
  const handleAction = (action: string) => () => {
    // eslint-disable-next-line no-console
    console.log(`[Demo] ${action}`);
  };

  // Top-level tabs — one per component
  const screenTabs: DemoTab[] = [
    {
      id: 'intro',
      label: 'IntroScreen',
      content: <IntroScreenDemo onStart={handleAction('onStart called')} />,
    },
    {
      id: 'question',
      label: 'QuestionCard',
      content: <QuestionCardDemo />,
    },
    {
      id: 'transition',
      label: 'TransitionCard',
      content: <TransitionCardDemo />,
    },
    {
      id: 'video',
      label: 'VideoQuestionCard',
      content: <VideoQuestionCardDemo />,
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
        title="Assessment Step Components"
        description="Step screen and card components for assessment flows (FFP-140)"
        showBackLink
      />

      {/* Implementation Status */}
      <ComponentSection title="Implementation Status">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatusCard title="IntroScreen" status="complete" />
          <StatusCard title="QuestionCard" status="complete" />
          <StatusCard title="TransitionCard" status="complete" />
          <StatusCard title="VideoQuestionCard" status="complete" />
          <StatusCard title="ResultsScreen" status="pending" task="FFP-221" />
          <StatusCard title="StepRenderer" status="pending" task="FFP-222" />
        </div>
      </ComponentSection>

      {/* Component demos */}
      <ComponentSection title="Component Demos">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Click through each tab to preview the assessment step components. IntroScreen is a
          standalone screen; the card components compose{' '}
          <code className="rounded bg-muted px-1">StepCard</code> for consistent layout.
        </Text>
        <DemoTabs tabs={screenTabs} />
      </ComponentSection>

      {/* Developer Instructions */}
      <DeveloperInstructions title="Usage Instructions">
        <div className="space-y-3">
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Import card components:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { QuestionCard, TransitionCard, VideoQuestionCard } from '@web/components/assessment';`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Import screen components:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { IntroScreen } from '@web/components/assessment';`}
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
// QuestionCard Demo (with variant tabs)
// ============================================================================

const QuestionCardDemo: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, AnswerValue | null>>({});

  const handleAnswer = (questionId: string, value: AnswerValue | null): void => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // eslint-disable-next-line no-console
    console.log(`[Demo] onAnswer: ${questionId} = ${JSON.stringify(value)}`);
  };

  const variantTabs: DemoTab[] = [
    {
      id: 'single-choice',
      label: 'Single Choice',
      content: (
        <div className="mx-auto max-w-3xl px-4 py-8">
          <QuestionCard
            config={mockQuestionStepConfig}
            question={mockSingleChoiceQuestion}
            questionNumber={1}
            totalQuestions={5}
            value={answers[mockSingleChoiceQuestion.id] ?? null}
            onAnswer={handleAnswer}
            footer={<MockFooter />}
          />
        </div>
      ),
    },
    {
      id: 'scale',
      label: 'Scale',
      content: (
        <div className="mx-auto max-w-3xl px-4 py-8">
          <QuestionCard
            config={mockQuestionStepConfig}
            question={mockScaleQuestion}
            questionNumber={3}
            totalQuestions={5}
            value={answers[mockScaleQuestion.id] ?? null}
            onAnswer={handleAnswer}
            footer={<MockFooter />}
          />
        </div>
      ),
    },
    {
      id: 'text',
      label: 'Text',
      content: (
        <div className="mx-auto max-w-3xl px-4 py-8">
          <QuestionCard
            config={mockQuestionStepConfig}
            question={mockTextQuestion}
            questionNumber={5}
            totalQuestions={5}
            value={answers[mockTextQuestion.id] ?? null}
            onAnswer={handleAnswer}
            footer={<MockFooter />}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Card layout around QuestionRenderer with question sub-progress indicator. Select different
        tabs to see various question types. Answers are interactive — try selecting options.
      </Text>
      <DemoTabs tabs={variantTabs} />
    </div>
  );
};

// ============================================================================
// TransitionCard Demo (with variant tabs)
// ============================================================================

const TransitionCardDemo: React.FC = () => {
  const variantTabs: DemoTab[] = [
    {
      id: 'full',
      label: 'Full Config',
      content: (
        <div className="mx-auto max-w-3xl px-4 py-8">
          <TransitionCard config={mockTransitionConfig} footer={<MockFooter />} />
        </div>
      ),
    },
    {
      id: 'no-safety',
      label: 'No Safety Notes',
      content: (
        <div className="mx-auto max-w-3xl px-4 py-8">
          <TransitionCard
            config={mockTransitionNoSafetyConfig}
            footer={<MockFooter />}
            showWhatsNextTitleDescription
          />
        </div>
      ),
    },
    {
      id: 'minimal',
      label: 'Minimal',
      content: (
        <div className="mx-auto max-w-3xl px-4 py-8">
          <TransitionCard
            config={mockTransitionMinimalConfig}
            footer={<MockFooter />}
            showWhatsNextTitleDescription
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Transition card displayed between assessment phases. Shows what to expect next, safety
        warnings from the flow configuration, and navigation in the footer.
      </Text>
      <DemoTabs tabs={variantTabs} />
    </div>
  );
};

// ============================================================================
// VideoQuestionCard Demo (with variant tabs)
// ============================================================================

const VideoQuestionCardDemo: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, AnswerValue | null>>({});

  const handleAnswer = (questionId: string, value: AnswerValue | null): void => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // eslint-disable-next-line no-console
    console.log(`[Demo] onAnswer: ${questionId} = ${JSON.stringify(value)}`);
  };

  const variantTabs: DemoTab[] = [
    {
      id: 'with-instructions',
      label: 'With Instructions',
      content: (
        <div className="mx-auto max-w-3xl px-4 py-8">
          <VideoQuestionCard
            config={mockVideoStepConfig}
            question={mockVideoQuestion}
            questionNumber={1}
            totalQuestions={3}
            value={answers[mockVideoQuestion.id] ?? null}
            onAnswer={handleAnswer}
            footer={<MockFooter />}
          />
        </div>
      ),
    },
    {
      id: 'no-instructions',
      label: 'No Instructions',
      content: (
        <div className="mx-auto max-w-3xl px-4 py-8">
          <VideoQuestionCard
            config={{ title: 'Physical Assessment' }}
            question={mockVideoQuestion}
            questionNumber={2}
            totalQuestions={3}
            value={answers[mockVideoQuestion.id] ?? null}
            onAnswer={handleAnswer}
            footer={<MockFooter />}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Video question card with instructions list and video-response question. The QuestionRenderer
        routes video-response types to the VideoResponseQuestion component.
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
