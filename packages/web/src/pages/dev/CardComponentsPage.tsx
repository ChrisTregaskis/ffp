import { Button } from '@web/components/button';
import { Card } from '@web/components/Card';
import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
  ButtonSampleDisplay,
} from '@web/components/dev';
import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { Text } from '@web/components/text';

/**
 * Card components showcase page (development only).
 *
 * Demonstrates all card component features:
 * - Basic cards with and without headers
 * - Centered headers (for auth cards)
 * - Custom styling options
 * - Real-world examples (auth, profile, settings, etc.)
 */
export function CardComponentsPage(): JSX.Element {
  return (
    <ComponentPageWrapper maxWidth="6xl">
      <ComponentPageHeader
        title="Card Components"
        description="Contained, elevated surfaces for displaying content"
        showBackLink
      />

      {/* Basic variations */}
      <ComponentSection title="Basic Variations">
        <div className="space-y-6">
          <ButtonSampleDisplay label="Card with title and subtitle">
            <Card title="Card Title" subtitle="This is a subtitle describing the card content">
              <Text>Card content goes here. This can be any React component or HTML.</Text>
            </Card>
          </ButtonSampleDisplay>

          <ButtonSampleDisplay label="Card with title only">
            <Card title="Simple Card">
              <Text>Content without a subtitle.</Text>
            </Card>
          </ButtonSampleDisplay>

          <ButtonSampleDisplay label="Card without header">
            <Card>
              <Text as="p" styleProps={{ weight: 'medium' }} className="mb-2">
                No Header Card
              </Text>
              <Text styleProps={{ colour: 'muted-foreground' }}>
                This card has no title or subtitle, just content.
              </Text>
            </Card>
          </ButtonSampleDisplay>

          <ButtonSampleDisplay label="Card with centered header">
            <Card title="Centered Header" subtitle="Perfect for auth cards" centerHeader>
              <Text className="text-center">Content can also be centered if needed.</Text>
            </Card>
          </ButtonSampleDisplay>
        </div>
      </ComponentSection>

      {/* Auth card examples */}
      <ComponentSection title="Auth Card Example">
        <div className="space-y-6">
          <ButtonSampleDisplay label="Sign In Card">
            <div className="flex justify-center">
              <Card
                title="Welcome Back"
                subtitle="Sign in to continue"
                centerHeader
                className="w-full max-w-md"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 border rounded-md"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border rounded-md"
                      disabled
                    />
                  </div>
                  <Button variant="primary" fullWidth disabled>
                    Sign In
                  </Button>
                  <Text
                    as="p"
                    styleProps={{ size: 'sm', colour: 'muted-foreground' }}
                    className="text-center"
                  >
                    Dont have an account?{' '}
                    <span className="text-primary font-medium cursor-pointer">Sign up</span>
                  </Text>
                </div>
              </Card>
            </div>
          </ButtonSampleDisplay>
        </div>
      </ComponentSection>

      {/* Real-world examples */}
      <ComponentSection title="Real-World Examples">
        <div className="space-y-6">
          <ButtonSampleDisplay label="User Profile Card">
            <Card title="User Profile" subtitle="Manage your personal information">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Text styleProps={{ size: 'xl', weight: 'semibold' }} className="text-primary">
                      JD
                    </Text>
                  </div>
                  <div>
                    <Text styleProps={{ weight: 'medium' }}>John Doe</Text>
                    <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                      john.doe@example.com
                    </Text>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm">
                    Edit Profile
                  </Button>
                  <Button variant="neutral" size="sm">
                    Change Password
                  </Button>
                </div>
              </div>
            </Card>
          </ButtonSampleDisplay>

          <ButtonSampleDisplay label="Loading State Card">
            <Card title="Loading Data" subtitle="Please wait while we fetch your information">
              <div className="py-8">
                <LoadingSpinner variant="center" size="md" />
              </div>
            </Card>
          </ButtonSampleDisplay>

          <ButtonSampleDisplay label="Stats Card">
            <Card>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Text styleProps={{ size: '2xl', weight: 'bold' }} className="text-primary">
                    1,234
                  </Text>
                  <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>Users</Text>
                </div>
                <div>
                  <Text styleProps={{ size: '2xl', weight: 'bold' }} className="text-success">
                    89%
                  </Text>
                  <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>Success Rate</Text>
                </div>
                <div>
                  <Text styleProps={{ size: '2xl', weight: 'bold' }} className="text-primary">
                    567
                  </Text>
                  <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>Active</Text>
                </div>
              </div>
            </Card>
          </ButtonSampleDisplay>
        </div>
      </ComponentSection>

      {/* Custom styling examples */}
      <ComponentSection title="Custom Styling">
        <div className="space-y-6">
          <ButtonSampleDisplay label="Card with custom width">
            <div className="flex justify-center">
              <Card title="Narrow Card" className="max-w-sm">
                <Text>This card has a maximum width constraint.</Text>
              </Card>
            </div>
          </ButtonSampleDisplay>

          <ButtonSampleDisplay label="Card with custom content spacing">
            <Card title="Spaced Content" contentClassName="space-y-4">
              <Text>First paragraph with spacing.</Text>
              <Text>Second paragraph with spacing.</Text>
              <Text>Third paragraph with spacing.</Text>
            </Card>
          </ButtonSampleDisplay>

          <ButtonSampleDisplay label="Card with background color override">
            <Card title="Custom Background" className="bg-primary/5">
              <Text>This card has a custom background colour.</Text>
            </Card>
          </ButtonSampleDisplay>
        </div>
      </ComponentSection>

      {/* Developer instructions */}
      <DeveloperInstructions title="Usage Instructions">
        <div className="space-y-3">
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Import the Card component:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { Card } from '@web/components/Card';`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Basic usage:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Card title="Card Title" subtitle="Card subtitle">
  <p>Card content</p>
</Card>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Auth card pattern:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Card
  title="Welcome Back"
  subtitle="Sign in to continue"
  centerHeader
  className="max-w-md"
>
  <LoginForm />
</Card>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Card without header:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`<Card>
  <CustomContent />
</Card>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Available options:
            </Text>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>title:</strong> Optional card title (rendered as h2)
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>subtitle:</strong> Optional card subtitle/description
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>centerHeader:</strong> Center align header (default: false)
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>className:</strong> Custom classes for card container
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>contentClassName:</strong> Custom classes for content area
                </Text>
              </li>
            </ul>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Default styling:
            </Text>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <Text styleProps={{ size: 'xs' }}>White background (bg-white)</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>Rounded corners (rounded-lg)</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>Shadow elevation (shadow-xl)</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>Border (border-border)</Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>Padding (p-8)</Text>
              </li>
            </ul>
          </div>
        </div>
      </DeveloperInstructions>
    </ComponentPageWrapper>
  );
}
