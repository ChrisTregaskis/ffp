import { useState } from 'react';

import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Select } from '@web/components/select';

import { type PrototypeVideo } from './prototype-videos';

interface AddExerciseControlProps {
  options: PrototypeVideo[];
  onAdd: (videoId: string) => void;
}

/** "Add Exercise" — reveals an inline picker of videos that could join the session. */
export const AddExerciseControl: React.FC<AddExerciseControlProps> = ({ options, onAdd }) => {
  const [isPicking, setIsPicking] = useState(false);

  if (!isPicking) {
    return (
      <Button
        variant="primary"
        size="sm"
        icon={<Icon name={Icons.PLUS} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
        onClick={() => {
          setIsPicking(true);
        }}
      >
        Add Exercise
      </Button>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex-1">
        <Select
          value=""
          placeholder="Choose an exercise to add…"
          ariaLabel="Add an exercise"
          options={options.map((video) => ({ value: video.id, label: video.title }))}
          onChange={(value) => {
            onAdd(String(value));
            setIsPicking(false);
          }}
        />
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsPicking(false);
        }}
      >
        Cancel
      </Button>
    </div>
  );
};
