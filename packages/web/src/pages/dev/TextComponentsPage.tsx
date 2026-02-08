import { DemoTabs, type DemoTab } from '@web/components/demo';
import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
  TextSampleDisplay,
} from '@web/components/dev';
import { Text, Title } from '@web/components/text';

/**
 * Text component showcase page (development only).
 *
 * Demonstrates all text component features:
 * - Size variations (xs, sm, base, lg, xl, 2xl, 3xl, 4xl)
 * - Colour variations (theme colours)
 * - Weight variations (normal, medium, semibold, bold)
 * - Element types (span, p, h1, h2, h3, h4, h5)
 * - Truncation feature
 * - Title component (heading levels, colours)
 */
export const TextComponentsPage = (): JSX.Element => {
  const componentTabs: DemoTab[] = [
    { id: 'text', label: 'Text', content: <TextDemo /> },
    { id: 'title', label: 'Title', content: <TitleDemo /> },
    { id: 'combined', label: 'Combined Examples', content: <CombinedExamplesDemo /> },
  ];

  return (
    <ComponentPageWrapper maxWidth="6xl">
      <ComponentPageHeader
        title="Text Components"
        description="Typography system with size, colour, and weight variations"
        showBackLink
      />

      <ComponentSection title="Component Demos">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Click through each tab to explore the Text and Title components. The Text component
          handles inline, block, and heading elements; the Title component provides semantic heading
          shortcuts with automatic sizing.
        </Text>
        <DemoTabs tabs={componentTabs} />
      </ComponentSection>

      {/* Developer instructions */}
      <DeveloperInstructions title="Usage Instructions">
        <div className="space-y-3">
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Import the components:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { Text, Title } from '@web/components/text';`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Text component - Basic usage (inline span):
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Text styleProps={{ size: 'lg', colour: 'primary', weight: 'medium' }}>
  Important text
</Text>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Text component - Heading element:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Text as="h2" styleProps={{ size: '2xl', weight: 'bold', colour: 'primary' }}>
  Section Heading
</Text>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Text component - With truncation:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Text styleProps={{ size: 'sm' }} truncationLength={100}>
  {longText}
</Text>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Title component - Automatic sizing:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Title as="h1" colour="primary">
  Page Heading
</Title>

<Title as="h3">
  Section Heading
</Title>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Text component options:
            </Text>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Sizes:</strong> xs, sm, base, lg, xl, 2xl, 3xl, 4xl
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Colours:</strong> primary, secondary, success, destructive, foreground,
                  muted-foreground, card-foreground, accent-foreground, warning, info, white,
                  ffp-navy
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Weights:</strong> normal, medium, semibold, bold
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Elements:</strong> span (default), p, h1, h2, h3, h4, h5
                </Text>
              </li>
            </ul>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Title component options:
            </Text>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Levels:</strong> h1 (4xl), h2 (3xl), h3 (2xl), h4 (xl), h5 (lg) - all bold
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Colours:</strong> Same as Text component
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
// Text Demo (with variant tabs)
// ============================================================================

const TextDemo: React.FC = () => {
  const sampleText = 'The quick brown fox jumps over the lazy dog';
  const longText =
    'This is a very long piece of text that will be truncated to demonstrate the truncation feature of the Text component. It should show an ellipsis when the character limit is reached.';

  const variantTabs: DemoTab[] = [
    {
      id: 'sizes',
      label: 'Sizes',
      content: (
        <div className="space-y-4">
          <TextSampleDisplay label="xs">
            <Text styleProps={{ size: 'xs' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="sm">
            <Text styleProps={{ size: 'sm' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="base">
            <Text styleProps={{ size: 'base' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="lg">
            <Text styleProps={{ size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="xl">
            <Text styleProps={{ size: 'xl' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="2xl">
            <Text styleProps={{ size: '2xl' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="3xl">
            <Text styleProps={{ size: '3xl' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="4xl">
            <Text styleProps={{ size: '4xl' }}>{sampleText}</Text>
          </TextSampleDisplay>
        </div>
      ),
    },
    {
      id: 'colours',
      label: 'Colours',
      content: (
        <div className="space-y-3">
          <TextSampleDisplay label="primary" labelWidth="w-44">
            <Text styleProps={{ colour: 'primary', size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="secondary" labelWidth="w-44">
            <Text styleProps={{ colour: 'secondary', size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="success" labelWidth="w-44">
            <Text styleProps={{ colour: 'success', size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="destructive" labelWidth="w-44">
            <Text styleProps={{ colour: 'destructive', size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="foreground (default)" labelWidth="w-44">
            <Text styleProps={{ colour: 'foreground', size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="muted-foreground" labelWidth="w-44">
            <Text styleProps={{ colour: 'muted-foreground', size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="warning" labelWidth="w-44">
            <Text styleProps={{ colour: 'warning', size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="info" labelWidth="w-44">
            <Text styleProps={{ colour: 'info', size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="ffp-navy" labelWidth="w-44">
            <Text styleProps={{ colour: 'ffp-navy', size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <div className="rounded-md bg-card p-3">
            <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-1">
              card-foreground (on card background)
            </Text>
            <Text styleProps={{ colour: 'card-foreground', size: 'lg' }}>{sampleText}</Text>
          </div>
          <div className="rounded-md bg-accent p-3">
            <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-1">
              accent-foreground (on accent background)
            </Text>
            <Text styleProps={{ colour: 'accent-foreground', size: 'lg' }}>{sampleText}</Text>
          </div>
          <div className="rounded-md bg-ffp-navy p-3">
            <Text styleProps={{ size: 'sm', colour: 'white' }} className="mb-1">
              white (on dark background)
            </Text>
            <Text styleProps={{ colour: 'white', size: 'lg' }}>{sampleText}</Text>
          </div>
        </div>
      ),
    },
    {
      id: 'weights',
      label: 'Weights',
      content: (
        <div className="space-y-3">
          <TextSampleDisplay label="normal" labelWidth="w-24">
            <Text styleProps={{ weight: 'normal', size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="medium" labelWidth="w-24">
            <Text styleProps={{ weight: 'medium', size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="semibold" labelWidth="w-24">
            <Text styleProps={{ weight: 'semibold', size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
          <TextSampleDisplay label="bold" labelWidth="w-24">
            <Text styleProps={{ weight: 'bold', size: 'lg' }}>{sampleText}</Text>
          </TextSampleDisplay>
        </div>
      ),
    },
    {
      id: 'elements',
      label: 'Elements',
      content: (
        <div className="space-y-6">
          {/* Span (default) */}
          <div>
            <Text
              as="p"
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              Span element (default, inline):
            </Text>
            <div className="rounded-md bg-accent p-4">
              <Text styleProps={{ colour: 'primary' }}>This is a span element. </Text>
              <Text styleProps={{ colour: 'secondary' }}>
                Multiple span elements appear inline.{' '}
              </Text>
              <Text styleProps={{ colour: 'success' }}>They flow together naturally.</Text>
            </div>
          </div>

          {/* Paragraph */}
          <div>
            <Text
              as="p"
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              Paragraph element (block):
            </Text>
            <div className="space-y-2 rounded-md bg-accent p-4">
              <Text as="p" styleProps={{ colour: 'primary' }}>
                This is a paragraph element.
              </Text>
              <Text as="p" styleProps={{ colour: 'secondary' }}>
                Each paragraph appears on its own line.
              </Text>
              <Text as="p" styleProps={{ colour: 'success' }}>
                They are block-level elements.
              </Text>
            </div>
          </div>

          {/* Heading elements */}
          <div>
            <Text
              as="p"
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              Heading elements (h1–h5):
            </Text>
            <div className="space-y-3 rounded-md bg-accent p-4">
              <Text as="h1" styleProps={{ size: '4xl', weight: 'bold' }}>
                h1 — Page heading
              </Text>
              <Text as="h2" styleProps={{ size: '3xl', weight: 'bold' }}>
                h2 — Section heading
              </Text>
              <Text as="h3" styleProps={{ size: '2xl', weight: 'semibold' }}>
                h3 — Subsection heading
              </Text>
              <Text as="h4" styleProps={{ size: 'xl', weight: 'semibold' }}>
                h4 — Group heading
              </Text>
              <Text as="h5" styleProps={{ size: 'lg', weight: 'medium' }}>
                h5 — Minor heading
              </Text>
            </div>
          </div>

          <div className="rounded-md border border-info/30 bg-info/5 p-3">
            <Text as="p" styleProps={{ size: 'sm', colour: 'info' }}>
              <strong>Note:</strong> Unlike the Title component, using{' '}
              <code className="rounded bg-muted px-1">as=&quot;h1&quot;</code> on Text does not
              auto-apply size or weight — you have full control via{' '}
              <code className="rounded bg-muted px-1">styleProps</code>.
            </Text>
          </div>
        </div>
      ),
    },
    {
      id: 'truncation',
      label: 'Truncation',
      content: (
        <div className="space-y-4">
          <div>
            <Text
              as="p"
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              Original text (no truncation):
            </Text>
            <div className="rounded-md bg-accent p-4">
              <Text styleProps={{ size: 'sm' }}>{longText}</Text>
            </div>
          </div>
          <div>
            <Text
              as="p"
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              Truncated to 50 characters:
            </Text>
            <div className="rounded-md bg-accent p-4">
              <Text styleProps={{ size: 'sm' }} truncationLength={50}>
                {longText}
              </Text>
            </div>
          </div>
          <div>
            <Text
              as="p"
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              Truncated to 100 characters:
            </Text>
            <div className="rounded-md bg-accent p-4">
              <Text styleProps={{ size: 'sm' }} truncationLength={100}>
                {longText}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Flexible text component supporting inline, block, and heading elements with configurable
        size, colour, weight, and truncation.
      </Text>
      <DemoTabs tabs={variantTabs} />
    </div>
  );
};

// ============================================================================
// Title Demo (with variant tabs)
// ============================================================================

const TitleDemo: React.FC = () => {
  const sampleText = 'The quick brown fox jumps over the lazy dog';

  const variantTabs: DemoTab[] = [
    {
      id: 'levels',
      label: 'Heading Levels',
      content: (
        <div className="space-y-4">
          <div>
            <Text
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              h1 (4xl, bold):
            </Text>
            <Title as="h1">{sampleText}</Title>
          </div>
          <div>
            <Text
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              h2 (3xl, bold):
            </Text>
            <Title as="h2">{sampleText}</Title>
          </div>
          <div>
            <Text
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              h3 (2xl, bold):
            </Text>
            <Title as="h3">{sampleText}</Title>
          </div>
          <div>
            <Text
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              h4 (xl, bold):
            </Text>
            <Title as="h4">{sampleText}</Title>
          </div>
          <div>
            <Text
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              h5 (lg, bold):
            </Text>
            <Title as="h5">{sampleText}</Title>
          </div>
        </div>
      ),
    },
    {
      id: 'colours',
      label: 'Colours',
      content: (
        <div className="space-y-3">
          <TextSampleDisplay label="primary" labelWidth="w-44">
            <Title as="h3" colour="primary">
              {sampleText}
            </Title>
          </TextSampleDisplay>
          <TextSampleDisplay label="secondary" labelWidth="w-44">
            <Title as="h3" colour="secondary">
              {sampleText}
            </Title>
          </TextSampleDisplay>
          <TextSampleDisplay label="success" labelWidth="w-44">
            <Title as="h3" colour="success">
              {sampleText}
            </Title>
          </TextSampleDisplay>
          <TextSampleDisplay label="destructive" labelWidth="w-44">
            <Title as="h3" colour="destructive">
              {sampleText}
            </Title>
          </TextSampleDisplay>
          <TextSampleDisplay label="foreground (default)" labelWidth="w-44">
            <Title as="h3" colour="foreground">
              {sampleText}
            </Title>
          </TextSampleDisplay>
          <TextSampleDisplay label="muted-foreground" labelWidth="w-44">
            <Title as="h3" colour="muted-foreground">
              {sampleText}
            </Title>
          </TextSampleDisplay>
          <div className="rounded-md bg-card p-3">
            <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-2">
              card-foreground (on card background)
            </Text>
            <Title as="h3" colour="card-foreground">
              {sampleText}
            </Title>
          </div>
          <div className="rounded-md bg-accent p-3">
            <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-2">
              accent-foreground (on accent background)
            </Text>
            <Title as="h3" colour="accent-foreground">
              {sampleText}
            </Title>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Semantic heading component with automatic size and bold weight per heading level. Use Title
        when you want sensible defaults; use Text with{' '}
        <code className="rounded bg-muted px-1">as=&quot;h2&quot;</code> when you need full control.
      </Text>
      <DemoTabs tabs={variantTabs} />
    </div>
  );
};

// ============================================================================
// Combined Examples Demo
// ============================================================================

const CombinedExamplesDemo: React.FC = () => {
  return (
    <div className="space-y-6">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Real-world usage patterns combining Text and Title components.
      </Text>

      {/* Alert Messages */}
      <div>
        <Title as="h3" className="mb-3" colour="card-foreground">
          Alert Messages
        </Title>
        <div className="space-y-3">
          <div className="rounded-md border border-green-200 bg-green-50 p-4">
            <Text
              as="p"
              styleProps={{ colour: 'success', size: 'sm', weight: 'medium' }}
              className="mb-1"
            >
              Success
            </Text>
            <Text as="p" styleProps={{ size: 'sm' }} className="text-green-700">
              Your changes have been saved successfully.
            </Text>
          </div>
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <Text
              as="p"
              styleProps={{ colour: 'destructive', size: 'sm', weight: 'medium' }}
              className="mb-1"
            >
              Error
            </Text>
            <Text as="p" styleProps={{ size: 'sm' }} className="text-red-700">
              An error occurred while processing your request.
            </Text>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div>
        <Title as="h3" className="mb-3" colour="card-foreground">
          Card Content
        </Title>
        <div className="rounded-lg bg-card p-6 shadow">
          <Title as="h4" className="mb-2" colour="card-foreground">
            Card Title
          </Title>
          <Text as="p" styleProps={{ colour: 'muted-foreground', size: 'sm' }} className="mb-4">
            This is a description using muted foreground colour for secondary text.
          </Text>
          <Text as="p" styleProps={{ size: 'sm' }}>
            Regular body text uses the default foreground colour for optimal readability.
          </Text>
        </div>
      </div>

      {/* Heading Hierarchy */}
      <div>
        <Title as="h3" className="mb-3" colour="card-foreground">
          Heading Hierarchy (Text as h tags)
        </Title>
        <div className="rounded-lg border border-border p-6">
          <Text as="h2" styleProps={{ size: '3xl', weight: 'bold', colour: 'primary' }}>
            Page Title
          </Text>
          <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-1">
            Introductory paragraph beneath the page title.
          </Text>
          <Text as="h3" styleProps={{ size: 'xl', weight: 'semibold' }} className="mt-6">
            Section Heading
          </Text>
          <Text as="p" styleProps={{ size: 'sm' }} className="mt-1">
            Body text within a section, using the default foreground colour.
          </Text>
          <Text
            as="h4"
            styleProps={{ size: 'lg', weight: 'medium', colour: 'muted-foreground' }}
            className="mt-4"
          >
            Subsection Heading
          </Text>
          <Text as="p" styleProps={{ size: 'sm' }} className="mt-1">
            More body content with different heading levels to demonstrate hierarchy.
          </Text>
        </div>
      </div>
    </div>
  );
};
