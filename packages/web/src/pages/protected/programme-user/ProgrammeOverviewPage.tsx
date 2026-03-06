import React from 'react';

import { SectionHeader, SectionPanel } from '@web/components/assessment';
import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { IconBadge, Icons } from '@web/components/Icon';
import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { Text } from '@web/components/text';
import { useActiveProgrammeQuery } from '@web/hooks/programmes';

/** Format a date for display using British English locale */
const formatDate = (date: Date): string =>
  new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/**
 * Programme Overview page for individual users.
 *
 * Fetches and displays the user's active programme details:
 * name, description, status, and start date. Exercise/workout
 * schedule will be added in FFP-3.
 */
export const ProgrammeOverviewPage: React.FC = () => {
  const { data: programme, isLoading, isError } = useActiveProgrammeQuery();

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-3xl px-4 py-12">
        <SectionPanel>
          <div className="flex flex-col items-center gap-4 px-6 py-16">
            <LoadingSpinner size="lg" />
            <Text as="p" styleProps={{ size: 'base', colour: 'muted-foreground' }}>
              Loading your programme...
            </Text>
          </div>
        </SectionPanel>
      </div>
    );
  }

  // Error / no programme state
  if (isError || !programme) {
    return (
      <div className="max-w-3xl px-4 py-12">
        <StaticAlert
          variant="warning"
          message="No active programme found. Please complete an assessment to receive your personalised programme."
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 px-4 py-8">
      {/* Header: programme name + status badge */}
      <div className="flex items-center gap-4">
        <IconBadge name={Icons.ACTIVITY} size="lg" variant="primary" appearance="solid" />
        <div>
          <Text
            as="h1"
            styleProps={{ size: '2xl', weight: 'bold', colour: 'ffp-navy' }}
            className="tracking-tight"
          >
            {programme.name}
          </Text>
          <span className="mt-1 inline-block rounded-full bg-success/20 px-3 py-0.5 text-xs font-semibold text-success">
            {programme.status.charAt(0).toUpperCase() + programme.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Description card */}
      {programme.description && (
        <SectionPanel>
          <div className="p-6">
            <SectionHeader icon={Icons.CLIPBOARDLIST} title="About Your Programme" />
            <Text as="p" styleProps={{ size: 'base', colour: 'muted-foreground' }} className="mt-3">
              {programme.description}
            </Text>
          </div>
        </SectionPanel>
      )}

      {/* Info row: start date */}
      <SectionPanel variant="tinted">
        <div className="flex items-center gap-3 px-6 py-4">
          <IconBadge name={Icons.CALENDAR} size="sm" variant="secondary" />
          <div>
            <Text as="span" styleProps={{ size: 'sm', weight: 'semibold', colour: 'ffp-navy' }}>
              Started
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              {formatDate(programme.createdAt)}
            </Text>
          </div>
        </div>
      </SectionPanel>

      {/* Coming soon placeholder for exercises (FFP-3) */}
      <SectionPanel>
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <IconBadge name={Icons.PLAY} size="md" variant="muted" />
          <Text as="h3" styleProps={{ size: 'lg', weight: 'semibold', colour: 'muted-foreground' }}>
            Exercises Coming Soon
          </Text>
          <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            Your personalised exercise schedule and video-guided workouts will appear here in a
            future update.
          </Text>
        </div>
      </SectionPanel>
    </div>
  );
};
