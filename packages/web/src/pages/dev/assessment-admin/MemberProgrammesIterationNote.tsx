import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

import { iconVar } from './prototype-labels';

const ADDITIONS = [
  'Programme columns for Programme Users — the active programme’s name, level and status (shown when the role filter is Programme User).',
  'A row action to open and edit that member’s programme.',
  'Today the users table surfaces no programme data, and there’s no admin endpoint to fetch a user’s programme — that join (and an admin “get member programme” read model) is the real change.',
];

/** Explains how the existing Users table is iterated for member-programme management. */
export const MemberProgrammesIterationNote: React.FC = () => (
  <div className="mb-5 rounded-lg border border-info/30 bg-info/10 p-4">
    <div className="flex items-center gap-2">
      <Icon name={Icons.ZAP} styleProps={{ size: 'sm', colour: iconVar('info') }} />
      <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'info' }}>
        Starting from today’s Users table — what member-programme management adds
      </Text>
    </div>
    <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mt-1">
      This is the existing Users table (same columns, search, role filter — defaulted to Programme
      User). The columns marked “(new)” and the points below are the iteration.
    </Text>
    <ul className="mt-2 space-y-1">
      {ADDITIONS.map((addition) => (
        <li key={addition} className="flex items-start gap-1.5">
          <Icon
            name={Icons.ARROWRIGHT}
            styleProps={{ size: 'xs', colour: iconVar('muted-foreground') }}
          />
          <Text styleProps={{ size: 'xs', colour: 'foreground' }}>{addition}</Text>
        </li>
      ))}
    </ul>
  </div>
);
