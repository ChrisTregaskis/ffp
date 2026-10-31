import { describe, expect, it } from 'vitest';

import { DEFAULT_FLOWS } from '../seed/seedAssessmentFlows';
import { DEFAULT_PROGRAMME_TEMPLATES } from '../seed/seedProgrammeTemplates';
import { LEVEL_PROGRAMME_SLUGS } from '../src/constants/level-scoring.constants';

// Generation looks a recommendation up by slug and refuses an inactive template
const activeSeededSlugs = DEFAULT_PROGRAMME_TEMPLATES.filter(
  (template) => template.isActive !== false
).map((template) => template.slug);

describe('Seeded programme recommendations', () => {
  it.each(Object.entries(LEVEL_PROGRAMME_SLUGS))(
    'level %s resolves to an active seeded template',
    (_level, slug) => {
      expect(activeSeededSlugs).toContain(slug);
    }
  );

  it.each(DEFAULT_FLOWS.map((flow) => [flow.name, flow] as const))(
    '%s recommends only active seeded templates',
    (_name, flow) => {
      const recommended = flow.scoringConfig.programmeMappings.map(
        (mapping) => mapping.programmeTemplateId
      );

      expect(recommended.length).toBeGreaterThan(0);
      expect(recommended.filter((slug) => !activeSeededSlugs.includes(slug))).toEqual([]);
    }
  );
});
