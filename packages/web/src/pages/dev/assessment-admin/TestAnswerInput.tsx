import { Text } from '@web/components/text';

import type { SampleAnswer } from './prototype-scoring';
import type { PrototypeQuestion } from './prototype-types';

interface TestAnswerInputProps {
  question: PrototypeQuestion;
  value: SampleAnswer | undefined;
  onChange: (value: SampleAnswer) => void;
}

/** A compact answer control for one scored question, used in the Test panel. */
export const TestAnswerInput: React.FC<TestAnswerInputProps> = ({ question, value, onChange }) => {
  if (question.type === 'single-choice') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {(question.options ?? []).map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
              }}
              className={`rounded-full border px-2.5 py-1 ${
                selected
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <Text styleProps={{ size: 'xs', colour: selected ? 'primary' : 'foreground' }}>
                {option.label}
                {option.score !== undefined ? ` (${String(option.score)})` : ''}
              </Text>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'multi-choice') {
    const selectedValues = Array.isArray(value) ? value : [];

    return (
      <div className="flex flex-wrap gap-1.5">
        {(question.options ?? []).map((option) => {
          const selected = selectedValues.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(
                  selected
                    ? selectedValues.filter((v) => v !== option.value)
                    : [...selectedValues, option.value]
                );
              }}
              className={`rounded-full border px-2.5 py-1 ${
                selected
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <Text styleProps={{ size: 'xs', colour: selected ? 'primary' : 'foreground' }}>
                {option.label} (+{String(option.score ?? 0)})
              </Text>
            </button>
          );
        })}
      </div>
    );
  }

  // numeric / scale → a gradient-fill slider (matches the ProgressBar gradient)
  const min = question.validation?.min ?? 0;
  const max = question.validation?.max ?? 10;
  const current = typeof value === 'number' ? value : min;
  const percent = max > min ? ((current - min) / (max - min)) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2 flex-1">
        {/* track */}
        <div className="absolute inset-0 rounded-full bg-muted" />
        {/* gradient fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-ffp-primary-blue to-ffp-dark-blue"
          style={{ width: `${String(percent)}%` }}
        />
        {/* thumb */}
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-white shadow"
          style={{ left: `${String(percent)}%` }}
        />
        {/* transparent native input for dragging / keyboard */}
        <input
          type="range"
          min={min}
          max={max}
          value={current}
          aria-label={question.questionText}
          onChange={(event) => {
            onChange(Number(event.target.value));
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <span className="w-10 text-right">
        <Text styleProps={{ size: 'sm', weight: 'semibold' }}>{String(current)}</Text>
      </span>
    </div>
  );
};
