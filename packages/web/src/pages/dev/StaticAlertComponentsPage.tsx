import { useState } from 'react';

import { Button } from '@web/components/button';
import { DemoTabs, type DemoTab } from '@web/components/demo';
import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
  ButtonSampleDisplay,
} from '@web/components/dev';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { Text } from '@web/components/text';

/**
 * StaticAlert components showcase page (development only).
 *
 * Demonstrates all static alert component features:
 * - Error, warning, and success variants
 * - Dismissible and non-dismissible alerts
 * - Real-world usage examples
 * - Accessibility features
 */
export const StaticAlertComponentsPage = (): JSX.Element => {
  const componentTabs: DemoTab[] = [
    { id: 'variants', label: 'Variants', content: <VariantsDemo /> },
    { id: 'appearances', label: 'Appearances', content: <AppearancesDemo /> },
    { id: 'dismissible', label: 'Dismissible', content: <DismissibleDemo /> },
    { id: 'real-world', label: 'Real-World Examples', content: <RealWorldDemo /> },
    { id: 'accessibility', label: 'Accessibility', content: <AccessibilityDemo /> },
  ];

  return (
    <ComponentPageWrapper maxWidth="6xl">
      <ComponentPageHeader
        title="Static Alert Components"
        description="Contextual alerts for errors, warnings, and success messages"
        showBackLink
      />

      <ComponentSection title="Component Demos">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Click through each tab to explore alert variants, dismissible behaviour, real-world usage,
          and accessibility features.
        </Text>
        <DemoTabs tabs={componentTabs} />
      </ComponentSection>

      {/* Developer instructions */}
      <DeveloperInstructions title="Usage Guidelines">
        <div className="space-y-3">
          <div>
            <Text styleProps={{ weight: 'medium', size: 'sm' }} className="mb-1">
              When to use StaticAlert:
            </Text>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <Text styleProps={{ size: 'sm' }}>Form validation errors</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'sm' }}>Authentication failures</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'sm' }}>Operation success confirmations</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'sm' }}>System warnings and notifications</Text>
              </li>
            </ul>
          </div>

          <div>
            <Text styleProps={{ weight: 'medium', size: 'sm' }} className="mb-1">
              When to use ToastAlert instead:
            </Text>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <Text styleProps={{ size: 'sm' }}>Temporary notifications that auto-dismiss</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'sm' }}>Non-blocking status updates</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'sm' }}>Background operation completions</Text>
              </li>
            </ul>
          </div>

          <div>
            <Text styleProps={{ weight: 'medium', size: 'sm' }} className="mb-1">
              Code Example:
            </Text>
            <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
              {`import { StaticAlert } from '@web/components/feedback/StaticAlert';

// Error alert
<StaticAlert
  variant="error"
  message="Invalid credentials"
  onDismiss={() => setError(null)}
/>

// Warning alert
<StaticAlert
  variant="warning"
  message="Session expiring soon"
/>

// Success alert
<StaticAlert
  variant="success"
  message="Changes saved"
  onDismiss={() => setSuccess(null)}
/>`}
            </pre>
          </div>
        </div>
      </DeveloperInstructions>
    </ComponentPageWrapper>
  );
};

// ============================================================================
// Variants Demo
// ============================================================================

const VariantsDemo: React.FC = () => (
  <div className="space-y-6">
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
      Three alert variants for different severity levels.
    </Text>
    <ButtonSampleDisplay label="Error Alert">
      <StaticAlert variant="error" message="Invalid email or password. Please try again." />
    </ButtonSampleDisplay>

    <ButtonSampleDisplay label="Warning Alert">
      <StaticAlert
        variant="warning"
        message="Your session will expire in 5 minutes. Please save your work."
      />
    </ButtonSampleDisplay>

    <ButtonSampleDisplay label="Success Alert">
      <StaticAlert variant="success" message="Your changes have been saved successfully." />
    </ButtonSampleDisplay>
  </div>
);

// ============================================================================
// Appearances Demo
// ============================================================================

const AppearancesDemo: React.FC = () => (
  <div className="space-y-8">
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
      Two appearance styles: soft (translucent tint) and solid (full-colour background with white
      text). Compare side-by-side to decide which suits different use cases.
    </Text>

    <div className="space-y-6">
      <ButtonSampleDisplay label="Error — Soft vs Solid">
        <div className="space-y-3">
          <StaticAlert
            variant="error"
            appearance="soft"
            message="Soft: Invalid email or password."
          />
          <StaticAlert
            variant="error"
            appearance="solid"
            message="Solid: Invalid email or password."
          />
        </div>
      </ButtonSampleDisplay>

      <ButtonSampleDisplay label="Warning — Soft vs Solid">
        <div className="space-y-3">
          <StaticAlert
            variant="warning"
            appearance="soft"
            message="Soft: Your session will expire in 5 minutes."
          />
          <StaticAlert
            variant="warning"
            appearance="solid"
            message="Solid: Your session will expire in 5 minutes."
          />
        </div>
      </ButtonSampleDisplay>

      <ButtonSampleDisplay label="Success — Soft vs Solid">
        <div className="space-y-3">
          <StaticAlert
            variant="success"
            appearance="soft"
            message="Soft: Your changes have been saved."
          />
          <StaticAlert
            variant="success"
            appearance="solid"
            message="Solid: Your changes have been saved."
          />
        </div>
      </ButtonSampleDisplay>
    </div>
  </div>
);

// ============================================================================
// Dismissible Demo
// ============================================================================

const DismissibleDemo: React.FC = () => {
  const [showError, setShowError] = useState(true);
  const [showWarning, setShowWarning] = useState(true);
  const [showSuccess, setShowSuccess] = useState(true);

  return (
    <div className="space-y-6">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Alerts with dismiss buttons. Click the close icon to dismiss, then use the button to
        restore.
      </Text>
      <ButtonSampleDisplay label="Dismissible Error">
        {showError ? (
          <StaticAlert
            variant="error"
            message="This error can be dismissed by clicking the close button."
            onDismiss={() => {
              setShowError(false);
            }}
          />
        ) : (
          <Button
            onClick={() => {
              setShowError(true);
            }}
            variant="secondary"
            size="sm"
          >
            Show Error Alert
          </Button>
        )}
      </ButtonSampleDisplay>

      <ButtonSampleDisplay label="Dismissible Warning">
        {showWarning ? (
          <StaticAlert
            variant="warning"
            message="This warning can be dismissed by clicking the close button."
            onDismiss={() => {
              setShowWarning(false);
            }}
          />
        ) : (
          <Button
            onClick={() => {
              setShowWarning(true);
            }}
            variant="secondary"
            size="sm"
          >
            Show Warning Alert
          </Button>
        )}
      </ButtonSampleDisplay>

      <ButtonSampleDisplay label="Dismissible Success">
        {showSuccess ? (
          <StaticAlert
            variant="success"
            message="This success message can be dismissed by clicking the close button."
            onDismiss={() => {
              setShowSuccess(false);
            }}
          />
        ) : (
          <Button
            onClick={() => {
              setShowSuccess(true);
            }}
            variant="secondary"
            size="sm"
          >
            Show Success Alert
          </Button>
        )}
      </ButtonSampleDisplay>
    </div>
  );
};

// ============================================================================
// Real-World Examples Demo
// ============================================================================

const RealWorldDemo: React.FC = () => (
  <div className="space-y-6">
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
      Common alert patterns in real application contexts.
    </Text>
    <ButtonSampleDisplay label="Form Validation Error">
      <StaticAlert
        variant="error"
        message="Please correct the following errors: Email is required, Password must be at least 8 characters."
      />
    </ButtonSampleDisplay>

    <ButtonSampleDisplay label="System Warning">
      <StaticAlert
        variant="warning"
        message="Scheduled maintenance will occur on Saturday at 2:00 AM GMT. The system will be unavailable for approximately 2 hours."
      />
    </ButtonSampleDisplay>

    <ButtonSampleDisplay label="Operation Success">
      <StaticAlert
        variant="success"
        message="User profile updated successfully. Changes will be visible immediately."
      />
    </ButtonSampleDisplay>

    <ButtonSampleDisplay label="Multi-line Error">
      <StaticAlert
        variant="error"
        message="Unable to process your request due to the following reasons: The server is temporarily unavailable, your session has expired, or there was a network error. Please try again in a few moments."
      />
    </ButtonSampleDisplay>
  </div>
);

// ============================================================================
// Accessibility Demo
// ============================================================================

const AccessibilityDemo: React.FC = () => (
  <div className="space-y-4">
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
      Built-in accessibility features for screen readers and keyboard navigation.
    </Text>
    <Text styleProps={{ weight: 'medium' }}>Built-in Accessibility:</Text>
    <ul className="list-disc space-y-2 pl-6">
      <li>
        <Text styleProps={{ size: 'sm' }}>
          <code className="rounded bg-muted px-1">role=&quot;alert&quot;</code> attribute for screen
          readers
        </Text>
      </li>
      <li>
        <Text styleProps={{ size: 'sm' }}>
          Semantic colour coding (red=error, yellow=warning, green=success)
        </Text>
      </li>
      <li>
        <Text styleProps={{ size: 'sm' }}>
          Icon indicators for visual context (circle=error, triangle=warning, checkmark=success)
        </Text>
      </li>
      <li>
        <Text styleProps={{ size: 'sm' }}>
          Keyboard accessible dismiss button with{' '}
          <code className="rounded bg-muted px-1">aria-label</code>
        </Text>
      </li>
      <li>
        <Text styleProps={{ size: 'sm' }}>
          Sufficient colour contrast ratios for WCAG compliance
        </Text>
      </li>
    </ul>
  </div>
);
