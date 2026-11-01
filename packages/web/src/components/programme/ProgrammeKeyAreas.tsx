import type { ProgrammeKeyArea } from '@ffp/core';

import { Badge, Text } from '@web/components/atoms';

export interface ProgrammeKeyAreasProps {
  keyAreas: ProgrammeKeyArea[];
}

/** The assessment answers a programme was shaped by, each question with its answers as chips. */
export const ProgrammeKeyAreas: React.FC<ProgrammeKeyAreasProps> = ({ keyAreas }) => {
  if (keyAreas.length === 0) {
    return (
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        No key areas were recorded for this programme.
      </Text>
    );
  }

  return (
    <ul className="space-y-3">
      {keyAreas.map((area) => (
        <li key={area.questionId} className="space-y-1.5">
          <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            {area.question}
          </Text>
          <div className="flex flex-wrap gap-1.5">
            {area.answers.map((answer) => (
              <Badge key={answer} label={answer} variant="brand" appearance="soft" />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
};
