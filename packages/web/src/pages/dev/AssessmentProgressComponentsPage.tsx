import { useState } from 'react';

import type { FlowStepType } from '@ffp/core';

import { AssessmentProgress } from '@web/components/AssessmentProgress';
import { Button } from '@web/components/button';
import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
  ButtonSampleDisplay,
} from '@web/components/dev';
import { Icon, Icons } from '@web/components/Icon';
import { Text, Title } from '@web/components/text';

/**
 * AssessmentProgress components showcase page (development only).
 *
 * Demonstrates all progress bar component features:
 * - Progress percentage calculation
 * - Phase label display
 * - Step counter display
 * - Various progress states
 */
export const AssessmentProgressComponentsPage = (): JSX.Element => {
  const [interactiveStep, setInteractiveStep] = useState(3);
  const totalSteps = 10;

  const phases: FlowStepType[] = [
    'intro',
    'questions',
    'transition',
    'video-assessment',
    'results',
    'programme-overview',
  ];

  return (
    <ComponentPageWrapper maxWidth="6xl">
      <ComponentPageHeader
        title="Assessment Progress Components"
        description="Progress bar showing assessment completion with phase labels and step counters"
        showBackLink
      />

      {/* Basic Usage */}
      <ComponentSection title="Basic Usage">
        <div className="space-y-6">
          <ButtonSampleDisplay label="Default progress bar">
            <div className="w-full max-w-md">
              <AssessmentProgress currentStep={3} totalSteps={10} phase="questions" />
            </div>
          </ButtonSampleDisplay>
        </div>
      </ComponentSection>

      {/* Progress States */}
      <ComponentSection title="Progress States">
        <div className="space-y-6">
          <ButtonSampleDisplay label="Just started (10%)">
            <div className="w-full max-w-md">
              <AssessmentProgress currentStep={1} totalSteps={10} phase="intro" />
            </div>
          </ButtonSampleDisplay>

          <ButtonSampleDisplay label="Mid-way (50%)">
            <div className="w-full max-w-md">
              <AssessmentProgress currentStep={5} totalSteps={10} phase="questions" />
            </div>
          </ButtonSampleDisplay>

          <ButtonSampleDisplay label="Almost complete (80%)">
            <div className="w-full max-w-md">
              <AssessmentProgress currentStep={8} totalSteps={10} phase="video-assessment" />
            </div>
          </ButtonSampleDisplay>

          <ButtonSampleDisplay label="Complete (100%)">
            <div className="w-full max-w-md">
              <AssessmentProgress currentStep={10} totalSteps={10} phase="results" />
            </div>
          </ButtonSampleDisplay>
        </div>
      </ComponentSection>

      {/* Phase Labels */}
      <ComponentSection title="Phase Labels">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-4">
          Each phase displays a human-readable label. The following shows all available phases:
        </Text>
        <div className="space-y-6">
          {phases.map((phase, index) => (
            <ButtonSampleDisplay key={phase} label={`Phase: ${phase}`}>
              <div className="w-full max-w-md">
                <AssessmentProgress
                  currentStep={index + 1}
                  totalSteps={phases.length}
                  phase={phase}
                />
              </div>
            </ButtonSampleDisplay>
          ))}
        </div>
      </ComponentSection>

      {/* Interactive Demo */}
      <ComponentSection title="Interactive Demo">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-4">
          Use the buttons below to simulate progress through an assessment:
        </Text>
        <div className="space-y-6">
          <div className="rounded-lg bg-card p-6 shadow">
            <AssessmentProgress
              currentStep={interactiveStep}
              totalSteps={totalSteps}
              phase={phases[Math.min(Math.floor((interactiveStep - 1) / 2), phases.length - 1)]}
            />
            <div className="mt-4 flex items-center justify-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setInteractiveStep((s) => Math.max(1, s - 1));
                }}
                disabled={interactiveStep <= 1}
              >
                Previous
              </Button>
              <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                Step {interactiveStep} of {totalSteps}
              </Text>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setInteractiveStep((s) => Math.min(totalSteps, s + 1));
                }}
                disabled={interactiveStep >= totalSteps}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </ComponentSection>

      {/* Real-World Examples */}
      <ComponentSection title="Real-World Examples" className="mb-8">
        <div className="space-y-6">
          <div>
            <Title as="h3" className="mb-3" colour="card-foreground">
              Assessment Header
            </Title>
            <div className="rounded-lg bg-card p-6 shadow">
              <div className="mb-6">
                <AssessmentProgress currentStep={4} totalSteps={12} phase="questions" />
              </div>
              <div className="border-t border-border pt-4">
                <Title as="h2" className="mb-2" colour="card-foreground">
                  Mobility Assessment
                </Title>
                <Text styleProps={{ colour: 'muted-foreground' }}>
                  Answer the following questions about your current mobility.
                </Text>
              </div>
            </div>
          </div>

          <div>
            <Title as="h3" className="mb-3" colour="card-foreground">
              Video Assessment Screen
            </Title>
            <div className="rounded-lg bg-card shadow">
              <div className="p-4">
                <AssessmentProgress currentStep={7} totalSteps={10} phase="video-assessment" />
              </div>
              <div className="aspect-video bg-muted">
                <div className="flex h-full items-center justify-center">
                  <Text styleProps={{ colour: 'muted-foreground' }}>Video Player Placeholder</Text>
                </div>
              </div>
              <div className="p-4">
                <Text styleProps={{ weight: 'medium' }}>Squat Assessment</Text>
                <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                  Follow the on-screen instructions to complete this exercise.
                </Text>
              </div>
            </div>
          </div>

          <div>
            <Title as="h3" className="mb-3" colour="card-foreground">
              Results Screen
            </Title>
            <div className="rounded-lg bg-card p-6 shadow">
              <AssessmentProgress currentStep={10} totalSteps={10} phase="results" />
              <div className="mt-6 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <Icon
                    name={Icons.CHECKCIRCLE}
                    styleProps={{ size: 'xl', colour: 'var(--success)' }}
                  />
                </div>
                <Title as="h2" className="mb-2" colour="card-foreground">
                  Assessment Complete!
                </Title>
                <Text styleProps={{ colour: 'muted-foreground' }}>
                  Your personalised programme is ready.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </ComponentSection>

      {/* Developer instructions */}
      <DeveloperInstructions title="Usage Instructions">
        <div className="space-y-3">
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Import the AssessmentProgress component:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { AssessmentProgress } from '@web/components/AssessmentProgress';`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Basic usage:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<AssessmentProgress currentStep={3} totalSteps={10} phase="questions" />`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              With AssessmentContext:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`const { assessmentState } = useAssessment();

<AssessmentProgress
  currentStep={assessmentState.currentStep}
  totalSteps={assessmentState.totalSteps}
  phase={assessmentState.phase}
/>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Available props:
            </Text>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>currentStep:</strong> Current step number (1-based, required)
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>totalSteps:</strong> Total number of steps (required)
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>phase:</strong> FlowStepType for the current phase (required)
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>className:</strong> Additional CSS classes (optional)
                </Text>
              </li>
            </ul>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Phase label utility function:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { getPhaseLabel } from '@web/components/AssessmentProgress';

const label = getPhaseLabel('questions'); // "Pre-Assessment"`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Available phases and labels:
            </Text>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>intro:</strong> Getting Started
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>questions:</strong> Pre-Assessment
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>transition:</strong> Preparing for Physical Assessment
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>video-assessment:</strong> Physical Assessment
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>results:</strong> Your Results
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>programme-overview:</strong> Programme Preview
                </Text>
              </li>
            </ul>
          </div>
        </div>
      </DeveloperInstructions>
    </ComponentPageWrapper>
  );
};
