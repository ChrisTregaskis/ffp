import { Button } from '@web/components/button';
import { DemoTabs, type DemoTab } from '@web/components/demo';
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
 * Button components showcase page (development only).
 *
 * Demonstrates all button component features:
 * - Variant variations (primary, secondary, success, destructive, neutral, link)
 * - Size variations (sm, md, lg) and full width
 * - Loading and disabled states
 * - Icon positioning (left, right)
 * - Real-world usage examples
 */
export const ButtonComponentsPage = (): JSX.Element => {
  const componentTabs: DemoTab[] = [
    { id: 'variants', label: 'Variants', content: <VariantsDemo /> },
    { id: 'sizes', label: 'Sizes', content: <SizesDemo /> },
    { id: 'states', label: 'States', content: <StatesDemo /> },
    { id: 'with-icons', label: 'With Icons', content: <WithIconsDemo /> },
    { id: 'real-world', label: 'Real-World Examples', content: <RealWorldDemo /> },
  ];

  return (
    <ComponentPageWrapper maxWidth="6xl">
      <ComponentPageHeader
        title="Button Components"
        description="Interactive buttons with variants, sizes, and states"
        showBackLink
      />

      <ComponentSection title="Component Demos">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Click through each tab to explore button variants, sizes, states, icon support, and
          real-world usage patterns.
        </Text>
        <DemoTabs tabs={componentTabs} />
      </ComponentSection>

      {/* Developer instructions */}
      <DeveloperInstructions title="Usage Instructions">
        <div className="space-y-3">
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Import the Button component:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { Button } from '@web/components/button';`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Basic usage:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Button variant="primary" onClick={handleClick}>
  Save Changes
</Button>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              With icon:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Button variant="destructive" icon={<TrashIcon />}>
  Delete
</Button>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Loading state:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Button loading disabled>
  Processing...
</Button>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Form submission:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Button type="submit" variant="primary">
  Submit Form
</Button>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Available options:
            </Text>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Variants:</strong> primary, secondary, success, destructive, neutral, link
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Sizes:</strong> sm, md (default), lg
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>States:</strong> loading, disabled
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Icon:</strong> Accepts ReactNode, position left or right
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Types:</strong> button (default), submit, reset
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Layout:</strong> fullWidth option available
                </Text>
              </li>
            </ul>
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
  <div className="space-y-3">
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
      Six button variants for different semantic purposes.
    </Text>
    <ButtonSampleDisplay label="Primary">
      <Button variant="primary">Primary Button</Button>
    </ButtonSampleDisplay>
    <ButtonSampleDisplay label="Secondary">
      <Button variant="secondary">Secondary Button</Button>
    </ButtonSampleDisplay>
    <ButtonSampleDisplay label="Success">
      <Button variant="success">Success Button</Button>
    </ButtonSampleDisplay>
    <ButtonSampleDisplay label="Destructive">
      <Button variant="destructive">Destructive Button</Button>
    </ButtonSampleDisplay>
    <ButtonSampleDisplay label="Neutral">
      <Button variant="neutral">Neutral Button</Button>
    </ButtonSampleDisplay>
    <ButtonSampleDisplay label="Link">
      <Button variant="link">Link Button</Button>
    </ButtonSampleDisplay>
  </div>
);

// ============================================================================
// Sizes Demo (includes full width)
// ============================================================================

const SizesDemo: React.FC = () => {
  const iconNames = Object.values(Icons);
  const sampleIcon = iconNames.length > 0 ? iconNames[0] : null;

  return (
    <div className="space-y-6">
      <div>
        <Text
          as="p"
          styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
          className="mb-3"
        >
          Size variations:
        </Text>
        <div className="space-y-3">
          <ButtonSampleDisplay label="Small (sm)">
            <Button size="sm">Small Button</Button>
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Medium (md)">
            <Button size="md">Medium Button</Button>
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Large (lg)">
            <Button size="lg">Large Button</Button>
          </ButtonSampleDisplay>
        </div>
      </div>
      <div>
        <Text
          as="p"
          styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
          className="mb-3"
        >
          Full width:
        </Text>
        <div className="space-y-3">
          <div>
            <Text
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              Primary full width:
            </Text>
            <Button variant="primary" fullWidth>
              Full Width Primary Button
            </Button>
          </div>
          <div>
            <Text
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              Secondary full width:
            </Text>
            <Button variant="secondary" fullWidth>
              Full Width Secondary Button
            </Button>
          </div>
          <div>
            <Text
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              With icon:
            </Text>
            <Button
              variant="success"
              fullWidth
              icon={sampleIcon ? <Icon name={sampleIcon} /> : undefined}
            >
              Full Width with Icon
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// States Demo (loading + disabled)
// ============================================================================

const StatesDemo: React.FC = () => {
  const stateTabs: DemoTab[] = [
    {
      id: 'loading',
      label: 'Loading',
      content: (
        <div className="space-y-3">
          <ButtonSampleDisplay label="Primary loading">
            <Button variant="primary" loading>
              Processing...
            </Button>
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Secondary loading">
            <Button variant="secondary" loading>
              Loading...
            </Button>
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Small loading">
            <Button size="sm" loading>
              Loading...
            </Button>
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Large loading">
            <Button size="lg" loading>
              Loading...
            </Button>
          </ButtonSampleDisplay>
        </div>
      ),
    },
    {
      id: 'disabled',
      label: 'Disabled',
      content: (
        <div className="space-y-3">
          <ButtonSampleDisplay label="Primary disabled">
            <Button variant="primary" disabled>
              Disabled Button
            </Button>
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Secondary disabled">
            <Button variant="secondary" disabled>
              Disabled Button
            </Button>
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Success disabled">
            <Button variant="success" disabled>
              Disabled Button
            </Button>
          </ButtonSampleDisplay>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Loading spinners and disabled states across different variants and sizes.
      </Text>
      <DemoTabs tabs={stateTabs} />
    </div>
  );
};

// ============================================================================
// With Icons Demo
// ============================================================================

const WithIconsDemo: React.FC = () => {
  const iconNames = Object.values(Icons);
  const sampleIcon = iconNames.length > 0 ? iconNames[0] : null;

  if (!sampleIcon) {
    return (
      <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        No icons available. Run <code className="rounded bg-muted px-1">pnpm icon:generate</code> to
        generate icons.
      </Text>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Text
          as="p"
          styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
          className="mb-3"
        >
          Icon on left (default):
        </Text>
        <div className="space-y-3">
          <ButtonSampleDisplay label="Primary">
            <Button variant="primary" icon={<Icon name={sampleIcon} />}>
              Save Changes
            </Button>
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Destructive">
            <Button variant="destructive" icon={<Icon name={sampleIcon} />}>
              Delete Item
            </Button>
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Small">
            <Button size="sm" icon={<Icon name={sampleIcon} />}>
              Small Icon
            </Button>
          </ButtonSampleDisplay>
        </div>
      </div>
      <div>
        <Text
          as="p"
          styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
          className="mb-3"
        >
          Icon on right:
        </Text>
        <div className="space-y-3">
          <ButtonSampleDisplay label="Primary">
            <Button variant="primary" icon={<Icon name={sampleIcon} />} iconPosition="right">
              Continue
            </Button>
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Link">
            <Button variant="link" icon={<Icon name={sampleIcon} />} iconPosition="right">
              Learn More
            </Button>
          </ButtonSampleDisplay>
        </div>
      </div>
      <div>
        <Text
          as="p"
          styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
          className="mb-3"
        >
          Loading state (replaces icon):
        </Text>
        <div className="space-y-3">
          <ButtonSampleDisplay label="Loading">
            <Button variant="primary" icon={<Icon name={sampleIcon} />} loading>
              Processing...
            </Button>
          </ButtonSampleDisplay>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Real-World Examples Demo
// ============================================================================

const RealWorldDemo: React.FC = () => {
  const iconNames = Object.values(Icons);
  const sampleIcon = iconNames.length > 0 ? iconNames[0] : null;

  return (
    <div className="space-y-6">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Common button patterns in real application layouts.
      </Text>

      <div>
        <Title as="h3" className="mb-3" colour="card-foreground">
          Form Actions
        </Title>
        <div className="rounded-lg bg-card p-6 shadow">
          <div className="flex justify-end gap-3">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary">Save Changes</Button>
          </div>
        </div>
      </div>

      <div>
        <Title as="h3" className="mb-3" colour="card-foreground">
          Confirmation Dialog
        </Title>
        <div className="rounded-lg bg-card p-6 shadow">
          <Text as="p" className="mb-4" styleProps={{ colour: 'card-foreground' }}>
            Are you sure you want to delete this item? This action cannot be undone.
          </Text>
          <div className="flex justify-end gap-3">
            <Button variant="secondary">Cancel</Button>
            <Button
              variant="destructive"
              icon={sampleIcon ? <Icon name={sampleIcon} /> : undefined}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Title as="h3" className="mb-3" colour="card-foreground">
          Call-to-Action Section
        </Title>
        <div className="rounded-lg bg-accent p-6">
          <Text as="p" className="mb-4" styleProps={{ size: 'lg', weight: 'medium' }}>
            Ready to get started?
          </Text>
          <Text as="p" className="mb-6" styleProps={{ colour: 'muted-foreground' }}>
            Join thousands of users who are already using our platform.
          </Text>
          <div className="flex gap-3">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
            <Button variant="link" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Title as="h3" className="mb-3" colour="card-foreground">
          Loading Submission
        </Title>
        <div className="rounded-lg bg-card p-6 shadow">
          <Text as="p" className="mb-4" styleProps={{ colour: 'card-foreground' }}>
            Processing your request...
          </Text>
          <Button variant="primary" loading disabled fullWidth>
            Submitting...
          </Button>
        </div>
      </div>

      <div>
        <Title as="h3" className="mb-3" colour="card-foreground">
          Button Group
        </Title>
        <div className="rounded-lg bg-card p-6 shadow">
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Option 1</Button>
            <Button size="sm" variant="neutral">
              Option 2
            </Button>
            <Button size="sm" variant="neutral">
              Option 3
            </Button>
            <Button size="sm" variant="neutral">
              Option 4
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
