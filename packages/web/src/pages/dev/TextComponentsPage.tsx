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
 * - Element types (span, p)
 * - Truncation feature
 */
export const TextComponentsPage = (): JSX.Element => {
  const sampleText = 'The quick brown fox jumps over the lazy dog';
  const longText =
    'This is a very long piece of text that will be truncated to demonstrate the truncation feature of the Text component. It should show an ellipsis when the character limit is reached.';

  return (
    <ComponentPageWrapper maxWidth="6xl">
      <ComponentPageHeader
        title="Text Components"
        description="Typography system with size, colour, and weight variations"
        showBackLink
      />

      {/* Size variations */}
      <ComponentSection title="Size Variations">
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
      </ComponentSection>

      {/* Colour variations */}
      <ComponentSection title="Colour Variations (Theme Colours)">
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
        </div>
      </ComponentSection>

      {/* Weight variations */}
      <ComponentSection title="Weight Variations">
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
      </ComponentSection>

      {/* Element types */}
      <ComponentSection title="Element Types">
        <div className="space-y-4">
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
        </div>
      </ComponentSection>

      {/* Truncation feature */}
      <ComponentSection title="Truncation Feature">
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
      </ComponentSection>

      {/* Title component variations */}
      <ComponentSection title="Title Component - Heading Levels">
        <div className="space-y-4">
          <div>
            <Text
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              h1 (4xl, bold):
            </Text>
            <Title as="h1">The quick brown fox jumps over the lazy dog</Title>
          </div>
          <div>
            <Text
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              h2 (3xl, bold):
            </Text>
            <Title as="h2">The quick brown fox jumps over the lazy dog</Title>
          </div>
          <div>
            <Text
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              h3 (2xl, bold):
            </Text>
            <Title as="h3">The quick brown fox jumps over the lazy dog</Title>
          </div>
          <div>
            <Text
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              h4 (xl, bold):
            </Text>
            <Title as="h4">The quick brown fox jumps over the lazy dog</Title>
          </div>
          <div>
            <Text
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-2"
            >
              h5 (lg, bold):
            </Text>
            <Title as="h5">The quick brown fox jumps over the lazy dog</Title>
          </div>
        </div>
      </ComponentSection>

      {/* Title colour variations */}
      <ComponentSection title="Title Component - Colour Variations">
        <div className="space-y-3">
          <TextSampleDisplay label="primary" labelWidth="w-44">
            <Title as="h3" colour="primary">
              The quick brown fox jumps over the lazy dog
            </Title>
          </TextSampleDisplay>
          <TextSampleDisplay label="secondary" labelWidth="w-44">
            <Title as="h3" colour="secondary">
              The quick brown fox jumps over the lazy dog
            </Title>
          </TextSampleDisplay>
          <TextSampleDisplay label="success" labelWidth="w-44">
            <Title as="h3" colour="success">
              The quick brown fox jumps over the lazy dog
            </Title>
          </TextSampleDisplay>
          <TextSampleDisplay label="destructive" labelWidth="w-44">
            <Title as="h3" colour="destructive">
              The quick brown fox jumps over the lazy dog
            </Title>
          </TextSampleDisplay>
          <TextSampleDisplay label="foreground (default)" labelWidth="w-44">
            <Title as="h3" colour="foreground">
              The quick brown fox jumps over the lazy dog
            </Title>
          </TextSampleDisplay>
          <TextSampleDisplay label="muted-foreground" labelWidth="w-44">
            <Title as="h3" colour="muted-foreground">
              The quick brown fox jumps over the lazy dog
            </Title>
          </TextSampleDisplay>
          <div className="rounded-md bg-card p-3">
            <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-2">
              card-foreground (on card background)
            </Text>
            <Title as="h3" colour="card-foreground">
              The quick brown fox jumps over the lazy dog
            </Title>
          </div>
          <div className="rounded-md bg-accent p-3">
            <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-2">
              accent-foreground (on accent background)
            </Text>
            <Title as="h3" colour="accent-foreground">
              The quick brown fox jumps over the lazy dog
            </Title>
          </div>
        </div>
      </ComponentSection>

      {/* Combined examples */}
      <ComponentSection title="Combined Examples" className="mb-8">
        <div className="space-y-6">
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
        </div>
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
              Text component - Paragraph element:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Text as="p" styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
  Description text
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
                  muted-foreground, card-foreground, accent-foreground
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Weights:</strong> normal, medium, semibold, bold
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Elements:</strong> span (default), p
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
