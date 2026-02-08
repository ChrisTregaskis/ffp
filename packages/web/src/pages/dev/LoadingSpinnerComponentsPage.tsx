import { DemoTabs, type DemoTab } from '@web/components/demo';
import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
  ButtonSampleDisplay,
} from '@web/components/dev';
import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { Text, Title } from '@web/components/text';

/**
 * LoadingSpinner components showcase page (development only).
 *
 * Demonstrates all loading spinner component features:
 * - Size variations (sm, md, lg)
 * - Variant variations (inline, center)
 * - Colour customisation
 * - Real-world usage examples
 */
export const LoadingSpinnerComponentsPage = (): JSX.Element => {
  const componentTabs: DemoTab[] = [
    { id: 'sizes', label: 'Sizes', content: <SizesDemo /> },
    { id: 'variants', label: 'Variants', content: <VariantsDemo /> },
    { id: 'colours', label: 'Colours', content: <ColoursDemo /> },
    { id: 'real-world', label: 'Real-World Examples', content: <RealWorldDemo /> },
  ];

  return (
    <ComponentPageWrapper maxWidth="6xl">
      <ComponentPageHeader
        title="Loading Spinner Components"
        description="Animated loading indicators with sizes, variants, and colour options"
        showBackLink
      />

      <ComponentSection title="Component Demos">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Click through each tab to explore spinner sizes, layout variants, colour customisation,
          and real-world usage patterns.
        </Text>
        <DemoTabs tabs={componentTabs} />
      </ComponentSection>

      {/* Developer instructions */}
      <DeveloperInstructions title="Usage Instructions">
        <div className="space-y-3">
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Import the LoadingSpinner component:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { LoadingSpinner } from '@web/components/LoadingSpinner';`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Basic usage:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<LoadingSpinner size="md" variant="inline" />`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Centered loading state:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<LoadingSpinner variant="center" size="lg" />`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Custom colour:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<LoadingSpinner colour="rgba(255, 255, 255, 0.8)" />`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Inline with text:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<div className="flex items-center gap-2">
  <LoadingSpinner size="sm" />
  <span>Loading...</span>
</div>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Available options:
            </Text>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Sizes:</strong> sm (16px), md (24px, default), lg (32px)
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Variants:</strong> inline (default), center
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Colour:</strong> Any CSS colour value (rgba recommended for transparency)
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Animation:</strong> Triple-ring rotation (1s, 2s, 4s speeds)
                </Text>
              </li>
            </ul>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Colour recommendations by background:
            </Text>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Primary/Success/Destructive:</strong> rgba(255, 255, 255, 0.8)
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Secondary:</strong> rgba(3, 2, 19, 0.7)
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Muted/Neutral:</strong> rgba(113, 113, 130, 0.8)
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>White/Card:</strong> rgba(109, 159, 255, 0.6) (default)
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
// Sizes Demo
// ============================================================================

const SizesDemo: React.FC = () => (
  <div className="space-y-3">
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
      Three size options for different use cases.
    </Text>
    <ButtonSampleDisplay label="Small (sm)">
      <LoadingSpinner size="sm" />
    </ButtonSampleDisplay>
    <ButtonSampleDisplay label="Medium (md) - Default">
      <LoadingSpinner size="md" />
    </ButtonSampleDisplay>
    <ButtonSampleDisplay label="Large (lg)">
      <LoadingSpinner size="lg" />
    </ButtonSampleDisplay>
  </div>
);

// ============================================================================
// Variants Demo
// ============================================================================

const VariantsDemo: React.FC = () => (
  <div className="space-y-6">
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
      Inline for flow content, center for full-container loading states.
    </Text>
    <div>
      <Text
        as="p"
        styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
        className="mb-3"
      >
        Inline variant (default):
      </Text>
      <div className="space-y-3">
        <ButtonSampleDisplay label="Inline spinner">
          <div className="flex items-center gap-2">
            <LoadingSpinner variant="inline" size="sm" />
            <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>Loading...</Text>
          </div>
        </ButtonSampleDisplay>
      </div>
    </div>
    <div>
      <Text
        as="p"
        styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
        className="mb-3"
      >
        Center variant:
      </Text>
      <div className="space-y-3">
        <ButtonSampleDisplay label="Centered spinner">
          <div className="h-24 w-full rounded-md border border-border">
            <LoadingSpinner variant="center" size="md" />
          </div>
        </ButtonSampleDisplay>
      </div>
    </div>
  </div>
);

// ============================================================================
// Colours Demo
// ============================================================================

const ColoursDemo: React.FC = () => (
  <div className="space-y-3">
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
      Custom colour via the colour prop. Use rgba values for transparency.
    </Text>
    <ButtonSampleDisplay label="Primary blue (default)">
      <LoadingSpinner colour="rgba(109, 159, 255, 0.6)" />
    </ButtonSampleDisplay>
    <ButtonSampleDisplay label="White (for dark backgrounds)">
      <div className="rounded-md bg-foreground p-4">
        <LoadingSpinner colour="rgba(255, 255, 255, 0.8)" />
      </div>
    </ButtonSampleDisplay>
    <ButtonSampleDisplay label="Success green">
      <LoadingSpinner colour="rgba(100, 200, 115, 0.7)" />
    </ButtonSampleDisplay>
    <ButtonSampleDisplay label="Destructive red">
      <LoadingSpinner colour="rgba(212, 24, 61, 0.7)" />
    </ButtonSampleDisplay>
    <ButtonSampleDisplay label="Muted grey">
      <LoadingSpinner colour="rgba(113, 113, 130, 0.8)" />
    </ButtonSampleDisplay>
  </div>
);

// ============================================================================
// Real-World Examples Demo
// ============================================================================

const RealWorldDemo: React.FC = () => (
  <div className="space-y-6">
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
      Common spinner patterns in real application layouts.
    </Text>

    <div>
      <Title as="h3" className="mb-3" colour="card-foreground">
        Loading Page
      </Title>
      <div className="h-48 rounded-lg bg-card shadow">
        <LoadingSpinner variant="center" size="lg" />
      </div>
    </div>

    <div>
      <Title as="h3" className="mb-3" colour="card-foreground">
        Inline Loading Text
      </Title>
      <div className="rounded-lg bg-card p-6 shadow">
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <Text styleProps={{ colour: 'muted-foreground' }}>Fetching data...</Text>
        </div>
      </div>
    </div>

    <div>
      <Title as="h3" className="mb-3" colour="card-foreground">
        Card Loading State
      </Title>
      <div className="rounded-lg bg-card p-6 shadow">
        <div className="mb-4">
          <Title as="h4" className="mb-2" colour="card-foreground">
            User Profile
          </Title>
          <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            Loading user information...
          </Text>
        </div>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      </div>
    </div>

    <div>
      <Title as="h3" className="mb-3" colour="card-foreground">
        Different Background Colours
      </Title>
      <div className="space-y-4">
        <div className="rounded-lg bg-primary p-6">
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" colour="rgba(255, 255, 255, 0.8)" />
            <Text className="text-white">Loading on primary background...</Text>
          </div>
        </div>
        <div className="rounded-lg bg-success p-6">
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" colour="rgba(255, 255, 255, 0.8)" />
            <Text className="text-white">Loading on success background...</Text>
          </div>
        </div>
        <div className="rounded-lg bg-muted p-6">
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" colour="rgba(113, 113, 130, 0.8)" />
            <Text styleProps={{ colour: 'muted-foreground' }}>Loading on muted background...</Text>
          </div>
        </div>
      </div>
    </div>

    <div>
      <Title as="h3" className="mb-3" colour="card-foreground">
        Table Loading State
      </Title>
      <div className="rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="px-4 py-12">
                <div className="flex flex-col items-center gap-3">
                  <LoadingSpinner size="md" />
                  <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                    Loading table data...
                  </Text>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <Title as="h3" className="mb-3" colour="card-foreground">
        Empty State with Spinner
      </Title>
      <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-12">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <div className="text-center">
            <Text as="p" styleProps={{ size: 'base', weight: 'medium' }} className="mb-1">
              Loading your content
            </Text>
            <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              This will only take a moment...
            </Text>
          </div>
        </div>
      </div>
    </div>
  </div>
);
