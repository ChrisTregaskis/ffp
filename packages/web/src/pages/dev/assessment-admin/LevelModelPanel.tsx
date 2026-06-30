import { Fragment } from 'react';

import { Text } from '@web/components/text';

import { LEVEL_META, type Level } from './prototype-level-model';

const LEVELS: Level[] = [1, 2, 3];

interface MatrixRow {
  activity: string;
  older: Level;
  younger: Level;
}

/** The confirmed activity × age → level matrix (under-40s bump up one, capped at Level 3). */
const MATRIX: MatrixRow[] = [
  { activity: 'Mostly lower', older: 1, younger: 2 },
  { activity: 'Mixed (no majority)', older: 2, younger: 3 },
  { activity: 'Mostly higher', older: 3, younger: 3 },
];

const LEVEL_STYLE: Record<Level, { bg: string; colour: 'info' | 'warning' | 'success' }> = {
  1: { bg: 'bg-info/10', colour: 'info' },
  2: { bg: 'bg-warning/10', colour: 'warning' },
  3: { bg: 'bg-success/10', colour: 'success' },
};

const LevelCell: React.FC<{ level: Level }> = ({ level }) => (
  <div className={`rounded px-2 py-1 text-center ${LEVEL_STYLE[level].bg}`}>
    <Text styleProps={{ size: 'sm', weight: 'semibold', colour: LEVEL_STYLE[level].colour }}>
      Level {level}
    </Text>
  </div>
);

/** A read-only explainer of the confirmed level model: activity tally + age bump + matrix. */
export const LevelModelPanel: React.FC = () => (
  <div className="space-y-6">
    {/* Two-step rule */}
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-4">
        <Text styleProps={{ size: 'sm', weight: 'semibold' }}>1 · Activity sets a base level</Text>
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-1">
          The three activity questions are tallied. A clear majority sets the base level — mostly
          lower → Level 1, mostly higher → Level 3. No majority falls to Level 2.
        </Text>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <Text styleProps={{ size: 'sm', weight: 'semibold' }}>2 · Age can bump it up</Text>
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-1">
          Under-40s start one level higher (capped at Level 3). 40+ stays on the base level. Age is
          a single cut: under 40 = younger, 40+ = older.
        </Text>
      </div>
    </div>

    {/* Matrix */}
    <div>
      <Text styleProps={{ size: 'sm', weight: 'semibold' }}>The resulting level</Text>
      <div className="mt-2 overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-3 gap-px bg-border">
          <div className="bg-muted px-3 py-2">
            <Text styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}>
              Activity tally
            </Text>
          </div>
          <div className="bg-muted px-3 py-2 text-center">
            <Text styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}>
              Older (40+)
            </Text>
          </div>
          <div className="bg-muted px-3 py-2 text-center">
            <Text styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}>
              Younger (under 40)
            </Text>
          </div>
          {MATRIX.map((row) => (
            <Fragment key={row.activity}>
              <div className="flex items-center bg-card px-3 py-2">
                <Text styleProps={{ size: 'sm' }}>{row.activity}</Text>
              </div>
              <div className="flex items-center justify-center bg-card px-3 py-2">
                <LevelCell level={row.older} />
              </div>
              <div className="flex items-center justify-center bg-card px-3 py-2">
                <LevelCell level={row.younger} />
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>

    {/* The three programmes a level maps to */}
    <div>
      <Text styleProps={{ size: 'sm', weight: 'semibold' }}>The three starting programmes</Text>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        {LEVELS.map((level) => (
          <div key={level} className="rounded-lg border border-border bg-card p-3">
            <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'primary' }}>
              {LEVEL_META[level].name}
            </Text>
            <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mt-0.5">
              {LEVEL_META[level].tagline}
            </Text>
          </div>
        ))}
      </div>
    </div>
  </div>
);
