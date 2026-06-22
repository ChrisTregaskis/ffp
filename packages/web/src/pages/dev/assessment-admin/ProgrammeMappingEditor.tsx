import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Select } from '@web/components/select';
import { Text } from '@web/components/text';

import { DIMENSION_LABELS, OPERATOR_LABELS } from './prototype-labels';
import { CONTROL_CLASS_AUTO } from './prototype-styles';

import type {
  ComparisonOperator,
  ProgrammeMapping,
  ProgrammeMappingCondition,
  ProgrammeTemplateOption,
  ScoreDimension,
} from './prototype-types';

interface ProgrammeMappingEditorProps {
  mapping: ProgrammeMapping;
  index: number;
  /** Dimensions defined on the flow — conditions reference these */
  availableDimensions: ScoreDimension[];
  programmeTemplates: ProgrammeTemplateOption[];
  onChange: (mapping: ProgrammeMapping) => void;
  onRemove: () => void;
  /** Widen the condition row when the editor column is narrowed by the test panel */
  compact?: boolean;
}

const OPERATORS: ComparisonOperator[] = ['lt', 'lte', 'gt', 'gte', 'eq'];

/** Editor for one score → programme mapping (conditions + recommended programme). */
export const ProgrammeMappingEditor: React.FC<ProgrammeMappingEditorProps> = ({
  mapping,
  index,
  availableDimensions,
  programmeTemplates,
  onChange,
  onRemove,
  compact = false,
}) => {
  const updateCondition = (
    conditionIndex: number,
    patch: Partial<ProgrammeMappingCondition>
  ): void => {
    onChange({
      ...mapping,
      conditions: mapping.conditions.map((condition, i) =>
        i === conditionIndex ? { ...condition, ...patch } : condition
      ),
    });
  };

  const addCondition = (): void => {
    const dimension = availableDimensions[0] ?? 'general';
    onChange({
      ...mapping,
      conditions: [...mapping.conditions, { dimension, operator: 'gte', value: 0 }],
    });
  };

  const removeCondition = (conditionIndex: number): void => {
    onChange({
      ...mapping,
      conditions: mapping.conditions.filter((_, i) => i !== conditionIndex),
    });
  };

  const dimensionOptions = (
    availableDimensions.length > 0 ? availableDimensions : (['general'] as ScoreDimension[])
  ).map((dimension) => ({ value: dimension, label: DIMENSION_LABELS[dimension] }));

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Text styleProps={{ weight: 'semibold' }}>Rule {index + 1}</Text>
        <button
          type="button"
          aria-label="Remove rule"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
        >
          <Icon name={Icons.TRASH2} styleProps={{ size: 'sm', colour: 'currentColor' }} />
        </button>
      </div>

      <div className="space-y-2">
        <Text styleProps={{ size: 'sm', weight: 'medium' }}>When…</Text>
        {mapping.conditions.map((condition, conditionIndex) => (
          <div
            key={conditionIndex}
            className={`flex items-center gap-2 ${compact ? 'max-w-[66%]' : 'max-w-[50%]'}`}
          >
            {conditionIndex > 0 && (
              <div className="w-16">
                <Select
                  value={mapping.operator ?? 'and'}
                  onChange={(value) => {
                    onChange({ ...mapping, operator: value as 'and' | 'or' });
                  }}
                  ariaLabel="Combine with"
                  options={[
                    { value: 'and', label: 'and' },
                    { value: 'or', label: 'or' },
                  ]}
                />
              </div>
            )}
            <div className="flex-1">
              <Select
                value={condition.dimension}
                onChange={(value) => {
                  updateCondition(conditionIndex, { dimension: value as ScoreDimension });
                }}
                ariaLabel="Dimension"
                options={dimensionOptions}
              />
            </div>
            <div className="w-40">
              <Select
                value={condition.operator}
                onChange={(value) => {
                  updateCondition(conditionIndex, { operator: value as ComparisonOperator });
                }}
                ariaLabel="Operator"
                options={OPERATORS.map((operator) => ({
                  value: operator,
                  label: OPERATOR_LABELS[operator],
                }))}
              />
            </div>
            <input
              className={`${CONTROL_CLASS_AUTO} w-20`}
              type="number"
              value={condition.value}
              onChange={(event) => {
                updateCondition(conditionIndex, { value: Number(event.target.value) });
              }}
            />
            <button
              type="button"
              aria-label="Remove condition"
              onClick={() => {
                removeCondition(conditionIndex);
              }}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Icon name={Icons.CLOSE} styleProps={{ size: 'sm', colour: 'currentColor' }} />
            </button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name={Icons.PLUS} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
          onClick={addCondition}
        >
          Add condition
        </Button>
      </div>

      <div
        className={`flex items-center gap-2 border-t border-border pt-3 ${
          compact ? 'max-w-[66%]' : 'max-w-[50%]'
        }`}
      >
        <Text styleProps={{ size: 'sm', weight: 'medium' }}>…recommend</Text>
        <div className="flex-1">
          <Select
            value={mapping.programmeTemplateId}
            onChange={(value) => {
              onChange({ ...mapping, programmeTemplateId: String(value) });
            }}
            ariaLabel="Recommended programme"
            placeholder="Select a programme…"
            options={programmeTemplates.map((template) => ({
              value: template.slug,
              label: template.name,
            }))}
          />
        </div>
      </div>
    </div>
  );
};
