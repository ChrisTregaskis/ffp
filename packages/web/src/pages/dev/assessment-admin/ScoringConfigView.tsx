import { useState } from 'react';

import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

import { DimensionCardEditor } from './DimensionCardEditor';
import { InfoNote } from './InfoNote';
import { ProgrammeMappingEditor } from './ProgrammeMappingEditor';
import { buildMinAnswers, type SampleAnswers } from './prototype-scoring';
import { SCROLL_CLASS } from './prototype-styles';
import { usePrototypeStore } from './PrototypeStore';
import { ScoringHelpContent } from './ScoringHelpContent';
import { ScoringTestPanel } from './ScoringTestPanel';
import { SlideOver } from './SlideOver';
import { ViewHeader } from './ViewHeader';

import type { DimensionConfig, ProgrammeMapping, ScoringConfig } from './prototype-types';

/** Structured scoring-config editor: dimensions + programme mappings (T3-5). */
export const ScoringConfigView: React.FC<{ flowId: string }> = ({ flowId }) => {
  const { flows, questions, programmeTemplates, navigate, updateScoringConfig } =
    usePrototypeStore();
  const flow = flows.find((item) => item.id === flowId);

  const [config, setConfig] = useState<ScoringConfig>(
    flow?.scoringConfig ?? { dimensions: [], programmeMappings: [] }
  );
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isNoteDismissed, setIsNoteDismissed] = useState(false);
  const [answers, setAnswers] = useState<SampleAnswers>(() =>
    flow ? buildMinAnswers(flow.scoringConfig, questions) : {}
  );
  const [highlightedMapping, setHighlightedMapping] = useState<number | null>(null);

  if (!flow) {
    return <ViewHeader title="Flow not found" />;
  }

  const updateDimension = (index: number, dimension: DimensionConfig): void => {
    setConfig((prev) => ({
      ...prev,
      dimensions: prev.dimensions.map((item, i) => (i === index ? dimension : item)),
    }));
  };

  const addDimension = (): void => {
    setConfig((prev) => ({
      ...prev,
      dimensions: [...prev.dimensions, { name: 'general', questionIds: [], maxScore: 0 }],
    }));
  };

  const removeDimension = (index: number): void => {
    setConfig((prev) => ({
      ...prev,
      dimensions: prev.dimensions.filter((_, i) => i !== index),
    }));
  };

  const updateMapping = (index: number, mapping: ProgrammeMapping): void => {
    setConfig((prev) => ({
      ...prev,
      programmeMappings: prev.programmeMappings.map((item, i) => (i === index ? mapping : item)),
    }));
  };

  const addMapping = (): void => {
    const dimension = config.dimensions[0]?.name ?? 'general';
    setConfig((prev) => ({
      ...prev,
      programmeMappings: [
        ...prev.programmeMappings,
        {
          conditions: [{ dimension, operator: 'gte', value: 0 }],
          operator: 'and',
          programmeTemplateId: '',
          priority: prev.programmeMappings.length + 1,
        },
      ],
    }));
  };

  const removeMapping = (index: number): void => {
    setConfig((prev) => ({
      ...prev,
      programmeMappings: prev.programmeMappings.filter((_, i) => i !== index),
    }));
  };

  const handleSave = (): void => {
    updateScoringConfig(flow.id, config);
    navigate({ name: 'flows' });
  };

  const handleJumpToMapping = (index: number): void => {
    document.getElementById(`mapping-card-${String(index)}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    setHighlightedMapping(index);
    window.setTimeout(() => {
      setHighlightedMapping(null);
    }, 1600);
  };

  const availableDimensions = config.dimensions.map((dimension) => dimension.name);

  return (
    <div>
      <ViewHeader
        title="Scoring"
        subtitle={`How ${flow.name} turns answers into a tailored programme.`}
        actions={
          <>
            <Button
              variant={isTestOpen ? 'primary' : 'secondary'}
              size="md"
              icon={<Icon name={Icons.PLAY} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
              onClick={() => {
                setIsTestOpen((prev) => !prev);
              }}
            >
              {isTestOpen ? 'Hide test' : 'Test scoring'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={
                <Icon name={Icons.HELPCIRCLE} styleProps={{ size: 'sm', colour: 'currentColor' }} />
              }
              onClick={() => {
                setIsHelpOpen(true);
              }}
            >
              How scoring works
            </Button>
            <Button variant="primary" size="md" onClick={handleSave}>
              Save scoring
            </Button>
          </>
        }
      />

      <div className={isTestOpen ? 'lg:flex lg:gap-6' : ''}>
        {/* Editor */}
        <div className={isTestOpen ? 'min-w-0 lg:flex-1' : ''}>
          {!isNoteDismissed && (
            <InfoNote
              onDismiss={() => {
                setIsNoteDismissed(true);
              }}
            >
              Without scoring, a flow falls back to the default programme for everyone. Dimensions
              group question scores; mappings decide which programme each score range recommends.
            </InfoNote>
          )}

          {/* Dimensions */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <Text styleProps={{ weight: 'semibold' }}>
                Dimensions ({config.dimensions.length})
              </Text>
              <Button
                variant="secondary"
                size="sm"
                icon={
                  <Icon name={Icons.PLUS} styleProps={{ size: 'sm', colour: 'currentColor' }} />
                }
                onClick={addDimension}
              >
                Add dimension
              </Button>
            </div>
            <div className="space-y-3">
              {config.dimensions.map((dimension, index) => (
                <DimensionCardEditor
                  key={index}
                  dimension={dimension}
                  questions={questions}
                  onChange={(next) => {
                    updateDimension(index, next);
                  }}
                  onRemove={() => {
                    removeDimension(index);
                  }}
                />
              ))}
              {config.dimensions.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
                  <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                    No dimensions yet. Add one to start scoring.
                  </Text>
                </div>
              )}
            </div>
          </div>

          {/* Programme mappings */}
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <Text styleProps={{ weight: 'semibold' }}>
                Programme mappings ({config.programmeMappings.length})
              </Text>
              <Button
                variant="secondary"
                size="sm"
                icon={
                  <Icon name={Icons.PLUS} styleProps={{ size: 'sm', colour: 'currentColor' }} />
                }
                onClick={addMapping}
              >
                Add mapping
              </Button>
            </div>
            <div className="space-y-3">
              {config.programmeMappings.map((mapping, index) => (
                <div
                  key={index}
                  id={`mapping-card-${String(index)}`}
                  className={`rounded-lg transition-shadow ${
                    highlightedMapping === index ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                >
                  <ProgrammeMappingEditor
                    mapping={mapping}
                    index={index}
                    availableDimensions={availableDimensions}
                    programmeTemplates={programmeTemplates}
                    compact={isTestOpen}
                    onChange={(next) => {
                      updateMapping(index, next);
                    }}
                    onRemove={() => {
                      removeMapping(index);
                    }}
                  />
                </div>
              ))}
              {config.programmeMappings.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
                  <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                    No mappings yet. Everyone would receive the default programme.
                  </Text>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test panel (sticky, persistent split) */}
        {isTestOpen && (
          <aside className="mt-6 lg:mt-0 lg:w-[560px] lg:shrink-0">
            <div className="lg:sticky lg:top-6">
              <div
                className={`max-h-[calc(100vh-5rem)] overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-sm ${SCROLL_CLASS}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <Text styleProps={{ weight: 'semibold' }}>Test scoring</Text>
                  <button
                    type="button"
                    aria-label="Close test panel"
                    onClick={() => {
                      setIsTestOpen(false);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Icon name={Icons.CLOSE} styleProps={{ size: 'sm', colour: 'currentColor' }} />
                  </button>
                </div>
                <ScoringTestPanel
                  config={config}
                  questions={questions}
                  programmeTemplates={programmeTemplates}
                  answers={answers}
                  onAnswersChange={setAnswers}
                  onJumpToMapping={handleJumpToMapping}
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      <SlideOver
        isOpen={isHelpOpen}
        onClose={() => {
          setIsHelpOpen(false);
        }}
        title="How scoring works"
        subtitle="From answers to a recommended programme."
      >
        <ScoringHelpContent />
      </SlideOver>
    </div>
  );
};
