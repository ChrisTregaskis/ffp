import { Button } from '@web/components/button';
import { DemoTabs, type DemoTab } from '@web/components/demo';
import {
  ButtonSampleDisplay,
  ComponentPageHeader,
  ComponentPageWrapper,
  ComponentSection,
  DeveloperInstructions,
} from '@web/components/dev';
import { ToastAlert } from '@web/components/feedback/ToastAlert';
import { Text } from '@web/components/text';
import { ToastProvider } from '@web/contexts/toast/ToastContext';
import { useToast } from '@web/hooks/useToast';

/** No-op dismiss handler for static inline demos */
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (): void => {};

/**
 * ToastAlert components showcase page (development only).
 *
 * Demonstrates all toast notification features:
 * - Success, error, warning, and info variants
 * - Auto-dismiss with progress bar
 * - Manual dismiss
 * - useToast hook integration
 * - Positioning options
 */
export const ToastAlertComponentsPage = (): JSX.Element => {
  const componentTabs: DemoTab[] = [
    { id: 'variants', label: 'Variants', content: <VariantsDemo /> },
    { id: 'auto-dismiss', label: 'Auto-Dismiss', content: <AutoDismissDemo /> },
    { id: 'hook', label: 'useToast Hook', content: <UseToastDemo /> },
    { id: 'real-world', label: 'Real-World Examples', content: <RealWorldDemo /> },
    { id: 'accessibility', label: 'Accessibility', content: <AccessibilityDemo /> },
  ];

  return (
    <ComponentPageWrapper maxWidth="6xl">
      <ComponentPageHeader
        title="Toast Alert Components"
        description="Auto-dismissing toast notifications for transient feedback"
        showBackLink
      />

      <ComponentSection title="Component Demos">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Click through each tab to explore toast variants, auto-dismiss behaviour, hook usage, and
          accessibility features.
        </Text>
        <DemoTabs tabs={componentTabs} />
      </ComponentSection>

      <DeveloperInstructions title="Usage Guidelines">
        <div className="space-y-3">
          <div>
            <Text styleProps={{ weight: 'medium', size: 'sm' }} className="mb-1">
              When to use ToastAlert:
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
              <li>
                <Text styleProps={{ size: 'sm' }}>Save confirmations and action feedback</Text>
              </li>
            </ul>
          </div>

          <div>
            <Text styleProps={{ weight: 'medium', size: 'sm' }} className="mb-1">
              When to use StaticAlert instead:
            </Text>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <Text styleProps={{ size: 'sm' }}>Form validation errors (user must act)</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'sm' }}>Authentication failures</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'sm' }}>Persistent warnings that require attention</Text>
              </li>
            </ul>
          </div>

          <div>
            <Text styleProps={{ weight: 'medium', size: 'sm' }} className="mb-1">
              Code Example (recommended - useToast hook):
            </Text>
            <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
              {`import { useToast } from '@web/contexts/ToastContext';

const MyComponent: React.FC = () => {
  const { addToast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      addToast('Changes saved successfully', { variant: 'success' });
    } catch {
      addToast('Failed to save changes', { variant: 'error' });
    }
  };

  return <Button onClick={handleSave}>Save</Button>;
};`}
            </pre>
          </div>

          <div>
            <Text styleProps={{ weight: 'medium', size: 'sm' }} className="mb-1">
              Code Example (standalone component):
            </Text>
            <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
              {`import { ToastAlert } from '@web/components/feedback/ToastAlert';

<ToastAlert
  id="save-success"
  variant="success"
  message="Changes saved successfully"
  duration={5000}
  visible={showToast}
  onDismiss={() => setShowToast(false)}
/>`}
            </pre>
          </div>
        </div>
      </DeveloperInstructions>
    </ComponentPageWrapper>
  );
};

// ============================================================================
// Variants Demo (inline, non-auto-dismissing for visual inspection)
// ============================================================================

const VariantsDemo: React.FC = () => (
  <div className="space-y-6">
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
      Four toast variants for different notification types. Shown inline (non-auto-dismissing) for
      visual inspection.
    </Text>

    <ButtonSampleDisplay label="Success Toast">
      <ToastAlert
        id="demo-success"
        variant="success"
        message="Assessment progress saved successfully."
        duration={0}
        onDismiss={noop}
      />
    </ButtonSampleDisplay>

    <ButtonSampleDisplay label="Error Toast">
      <ToastAlert
        id="demo-error"
        variant="error"
        message="Failed to submit assessment. Please try again."
        duration={0}
        onDismiss={noop}
      />
    </ButtonSampleDisplay>

    <ButtonSampleDisplay label="Warning Toast">
      <ToastAlert
        id="demo-warning"
        variant="warning"
        message="Your session will expire in 5 minutes."
        duration={0}
        onDismiss={noop}
      />
    </ButtonSampleDisplay>

    <ButtonSampleDisplay label="Info Toast">
      <ToastAlert
        id="demo-info"
        variant="info"
        message="A new assessment is available for you."
        duration={0}
        onDismiss={noop}
      />
    </ButtonSampleDisplay>
  </div>
);

// ============================================================================
// Auto-Dismiss Demo
// ============================================================================

const AutoDismissDemo: React.FC = () => (
  <ToastProvider position="top-right">
    <AutoDismissDemoContent />
  </ToastProvider>
);

const AutoDismissDemoContent: React.FC = () => {
  const { addToast } = useToast();

  return (
    <div className="space-y-6">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Toasts auto-dismiss after a configurable duration. A progress bar shows the remaining time.
        Click the buttons to trigger live toasts.
      </Text>

      <ButtonSampleDisplay label="3 Second Toast">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            addToast('This disappears in 3 seconds', { variant: 'info', duration: 3000 })
          }
        >
          Show 3s Toast
        </Button>
      </ButtonSampleDisplay>

      <ButtonSampleDisplay label="5 Second Toast (default)">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addToast('Default 5 second duration', { variant: 'success' })}
        >
          Show 5s Toast
        </Button>
      </ButtonSampleDisplay>

      <ButtonSampleDisplay label="8 Second Toast">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            addToast('This stays for 8 seconds', { variant: 'warning', duration: 8000 })
          }
        >
          Show 8s Toast
        </Button>
      </ButtonSampleDisplay>
    </div>
  );
};

// ============================================================================
// useToast Hook Demo
// ============================================================================

const UseToastDemo: React.FC = () => (
  <ToastProvider position="top-right">
    <UseToastDemoContent />
  </ToastProvider>
);

const UseToastDemoContent: React.FC = () => {
  const { addToast, dismissAll } = useToast();

  return (
    <div className="space-y-6">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        The useToast hook provides addToast, dismissToast, and dismissAll methods. Wrap your app (or
        subtree) with ToastProvider to enable toast notifications anywhere.
      </Text>

      <ButtonSampleDisplay label="Add Toasts">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addToast('Operation completed', { variant: 'success' })}
          >
            Success
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addToast('Something went wrong', { variant: 'error' })}
          >
            Error
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addToast('Check your input', { variant: 'warning' })}
          >
            Warning
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addToast('New feature available', { variant: 'info' })}
          >
            Info
          </Button>
        </div>
      </ButtonSampleDisplay>

      <ButtonSampleDisplay label="Stack Multiple">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            addToast('First notification', { variant: 'info', duration: 8000 });
            setTimeout(
              () => addToast('Second notification', { variant: 'success', duration: 8000 }),
              200
            );
            setTimeout(
              () => addToast('Third notification', { variant: 'warning', duration: 8000 }),
              400
            );
          }}
        >
          Show 3 Toasts
        </Button>
      </ButtonSampleDisplay>

      <ButtonSampleDisplay label="Dismiss All">
        <Button variant="secondary" size="sm" onClick={dismissAll}>
          Dismiss All
        </Button>
      </ButtonSampleDisplay>
    </div>
  );
};

// ============================================================================
// Real-World Examples Demo
// ============================================================================

const RealWorldDemo: React.FC = () => (
  <ToastProvider position="top-right">
    <RealWorldDemoContent />
  </ToastProvider>
);

const RealWorldDemoContent: React.FC = () => {
  const { addToast } = useToast();

  return (
    <div className="space-y-6">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Common toast patterns in real application contexts.
      </Text>

      <ButtonSampleDisplay label="Save Progress">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addToast('Assessment progress saved', { variant: 'success' })}
        >
          Save Progress
        </Button>
      </ButtonSampleDisplay>

      <ButtonSampleDisplay label="Network Error">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            addToast('Unable to connect to server. Please check your connection.', {
              variant: 'error',
              duration: 8000,
            })
          }
        >
          Simulate Error
        </Button>
      </ButtonSampleDisplay>

      <ButtonSampleDisplay label="Session Warning">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            addToast('Your session will expire in 5 minutes. Please save your work.', {
              variant: 'warning',
              duration: 8000,
            })
          }
        >
          Session Warning
        </Button>
      </ButtonSampleDisplay>

      <ButtonSampleDisplay label="Programme Generated">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            addToast('Your personalised workout programme is ready!', { variant: 'success' })
          }
        >
          Programme Ready
        </Button>
      </ButtonSampleDisplay>
    </div>
  );
};

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
          <code className="rounded bg-muted px-1">role=&quot;status&quot;</code> with{' '}
          <code className="rounded bg-muted px-1">aria-live=&quot;polite&quot;</code> for
          non-intrusive screen reader announcements
        </Text>
      </li>
      <li>
        <Text styleProps={{ size: 'sm' }}>
          Semantic colour coding (green=success, red=error, yellow=warning, blue=info)
        </Text>
      </li>
      <li>
        <Text styleProps={{ size: 'sm' }}>
          Icon indicators for visual context (checkmark=success, circle=error, triangle=warning,
          question=info)
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
          Auto-dismiss with visual progress bar (no reliance on timing alone)
        </Text>
      </li>
      <li>
        <Text styleProps={{ size: 'sm' }}>
          Toast container labelled with{' '}
          <code className="rounded bg-muted px-1">aria-label=&quot;Notifications&quot;</code>
        </Text>
      </li>
    </ul>
  </div>
);
