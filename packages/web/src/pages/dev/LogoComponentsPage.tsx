import { type ReactNode } from 'react';

import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
  ButtonSampleDisplay,
} from '@web/components/dev';
import { Logo } from '@web/components/logo';
import { Text, Title } from '@web/components/text';

interface LogoWrapper {
  children: ReactNode;
}

const LogoWrapper = ({ children }: LogoWrapper): JSX.Element => {
  return <div className="flex flex-col items-center gap-2">{children}</div>;
};

/**
 * Logo components showcase page (development only).
 *
 * Demonstrates all logo component features:
 * - Variant variations (brand-blue, primary-dark, secondary-light, icon, white)
 * - Size variations (xs, sm, md, lg, xl)
 * - Clickable logos
 * - Different backgrounds to show variant visibility
 */
export const LogoComponentsPage = (): JSX.Element => {
  return (
    <ComponentPageWrapper maxWidth="6xl">
      <ComponentPageHeader
        title="Logo Components"
        description="Fit For Purpose brand logos with variants and sizes"
        showBackLink
      />

      {/* Variant variations */}
      <ComponentSection title="Variant Variations">
        <div className="space-y-3">
          <ButtonSampleDisplay label="Brand Blue (default)">
            <Logo variant="brand-blue" />
          </ButtonSampleDisplay>
          <div className="rounded-lg bg-white p-4">
            <ButtonSampleDisplay label="Primary Dark (with background)">
              <Logo variant="primary-dark" />
            </ButtonSampleDisplay>
          </div>
          <div className="rounded-lg bg-gray-100 p-4">
            <ButtonSampleDisplay label="Secondary Light">
              <Logo variant="secondary-light" />
            </ButtonSampleDisplay>
          </div>
          <ButtonSampleDisplay label="Icon (small with background)">
            <Logo variant="icon" />
          </ButtonSampleDisplay>
          <div className="rounded-lg bg-gray-900 p-4">
            <ButtonSampleDisplay label="White (for dark backgrounds)">
              <Logo variant="white" />
            </ButtonSampleDisplay>
          </div>
        </div>
      </ComponentSection>

      {/* Size variations */}
      <ComponentSection title="Size Variations">
        <div className="space-y-4">
          <ButtonSampleDisplay label="Extra Small (xs)">
            <Logo size="xs" />
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Small (sm)">
            <Logo size="sm" />
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Medium (md) - default">
            <Logo size="md" />
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Large (lg)">
            <Logo size="lg" />
          </ButtonSampleDisplay>
          <ButtonSampleDisplay label="Extra Large (xl)">
            <Logo size="xl" />
          </ButtonSampleDisplay>
        </div>
      </ComponentSection>

      {/* Variants on different backgrounds */}
      <ComponentSection title="Variants on Different Backgrounds">
        <div className="space-y-6">
          <div>
            <Text
              as="p"
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-3"
            >
              On white background:
            </Text>
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-white p-6 md:grid-cols-5">
              <LogoWrapper>
                <Logo variant="brand-blue" size="sm" />
                <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>Brand Blue</Text>
              </LogoWrapper>
              <LogoWrapper>
                <Logo variant="primary-dark" size="sm" />
                <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>Primary Dark</Text>
              </LogoWrapper>
              <LogoWrapper>
                <Logo variant="secondary-light" size="sm" />
                <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>Secondary Light</Text>
              </LogoWrapper>
              <LogoWrapper>
                <Logo variant="icon" size="sm" />
                <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>Icon</Text>
              </LogoWrapper>
              <LogoWrapper>
                <Logo variant="white" size="sm" />
                <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>White</Text>
              </LogoWrapper>
            </div>
          </div>

          <div>
            <Text
              as="p"
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-3"
            >
              On dark background:
            </Text>
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-900 p-6 md:grid-cols-5">
              <LogoWrapper>
                <Logo variant="brand-blue" size="sm" />
                <Text styleProps={{ size: 'xs' }} className="text-white">
                  Brand Blue
                </Text>
              </LogoWrapper>
              <LogoWrapper>
                <Logo variant="primary-dark" size="sm" />
                <Text styleProps={{ size: 'xs' }} className="text-white">
                  Primary Dark
                </Text>
              </LogoWrapper>
              <LogoWrapper>
                <Logo variant="secondary-light" size="sm" />
                <Text styleProps={{ size: 'xs' }} className="text-white">
                  Secondary Light
                </Text>
              </LogoWrapper>
              <LogoWrapper>
                <Logo variant="icon" size="sm" />
                <Text styleProps={{ size: 'xs' }} className="text-white">
                  Icon
                </Text>
              </LogoWrapper>
              <LogoWrapper>
                <Logo variant="white" size="sm" />
                <Text styleProps={{ size: 'xs' }} className="text-white">
                  White
                </Text>
              </LogoWrapper>
            </div>
          </div>

          <div>
            <Text
              as="p"
              styleProps={{ size: 'sm', colour: 'muted-foreground', weight: 'medium' }}
              className="mb-3"
            >
              On coloured background:
            </Text>
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-6 md:grid-cols-5">
              <LogoWrapper>
                <Logo variant="brand-blue" size="sm" />
                <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>Brand Blue</Text>
              </LogoWrapper>
              <LogoWrapper>
                <Logo variant="primary-dark" size="sm" />
                <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>Primary Dark</Text>
              </LogoWrapper>
              <LogoWrapper>
                <Logo variant="secondary-light" size="sm" />
                <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>Secondary Light</Text>
              </LogoWrapper>
              <LogoWrapper>
                <Logo variant="icon" size="sm" />
                <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>Icon</Text>
              </LogoWrapper>
              <LogoWrapper>
                <Logo variant="white" size="sm" />
                <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>White</Text>
              </LogoWrapper>
            </div>
          </div>
        </div>
      </ComponentSection>

      {/* Real-world examples */}
      <ComponentSection title="Real-World Examples" className="mb-8">
        <div className="space-y-6">
          <div>
            <Title as="h3" className="mb-3" colour="card-foreground">
              Login Page
            </Title>
            <div className="rounded-lg bg-white p-8 shadow">
              <div className="flex flex-col items-center">
                <Logo variant="primary-dark" size="lg" />
                <Text
                  as="p"
                  className="mt-4"
                  styleProps={{ size: 'lg', weight: 'medium', colour: 'muted-foreground' }}
                >
                  Welcome to Fit For Purpose
                </Text>
              </div>
            </div>
          </div>

          <div>
            <Title as="h3" className="mb-3" colour="card-foreground">
              Footer
            </Title>
            <div className="rounded-lg bg-gray-900 p-6 shadow">
              <div className="flex items-center justify-between">
                <Logo variant="white" size="xs" />
                <Text className="text-gray-400" styleProps={{ size: 'xs' }}>
                  © 2025 Fit For Purpose. All rights reserved.
                </Text>
              </div>
            </div>
          </div>

          <div>
            <Title as="h3" className="mb-3" colour="card-foreground">
              Clickable Logo (e.g., navigate home)
            </Title>
            <div className="rounded-lg bg-card p-6 shadow">
              <Logo
                variant="brand-blue"
                size="md"
                onClick={() => {
                  alert('Logo clicked! Would navigate to home page.');
                }}
                className="transition-opacity hover:opacity-80"
              />
              <Text as="p" className="mt-2" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                Click the logo to test the onClick handler
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
              Import the Logo component:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { Logo } from '@web/components/logo';`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Basic usage:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Logo variant="brand-blue" size="md" />`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Clickable logo (e.g., navigate home):
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Logo
  variant="primary-dark"
  size="sm"
  onClick={() => navigate('/')}
/>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              With custom classes:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Logo
  variant="icon"
  size="xs"
  className="rounded-md hover:opacity-80"
/>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Available options:
            </Text>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Variants:</strong> brand-blue (default), primary-dark, secondary-light,
                  icon, white
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>Sizes:</strong> xs, sm, md (default), lg, xl
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>onClick:</strong> Optional click handler for navigation
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>alt:</strong> Customisable alt text for accessibility (default: &apos;Fit
                  For Purpose logo&apos;)
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>className:</strong> Additional custom Tailwind classes
                </Text>
              </li>
            </ul>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Variant recommendations:
            </Text>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>brand-blue:</strong> Use on white/light backgrounds, primary brand colour
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>primary-dark:</strong> Logo with dark background, good for hero sections
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>secondary-light:</strong> Logo with light background, good for dark
                  headers/footers
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>icon:</strong> Compact version with background, good for favicons and
                  small spaces
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>white:</strong> White logo for dark backgrounds, ideal for footers and
                  dark navigation bars
                </Text>
              </li>
            </ul>
          </div>
        </div>
      </DeveloperInstructions>
    </ComponentPageWrapper>
  );
};
