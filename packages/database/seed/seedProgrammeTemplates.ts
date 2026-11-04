import { eq } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';

import { LEVEL_PROGRAMME_SLUGS } from '../src/constants/level-scoring.constants.js';
import { createLogger } from '../src/lib/logger.js';
import { programmeTemplates } from '../src/schema/index.js';

import { requireSeedId } from './requireSeedId.js';

import type * as schema from '../src/schema/index.js';
import type { NewProgrammeTemplate } from '../src/schema/programme-templates.js';

const logger = createLogger('seed-programme-templates');

/**
 * Deterministic UUIDs for programme templates, keyed by slug
 *
 * The flows' scoring configs recommend these by slug (LEVEL_PROGRAMME_SLUGS).
 *
 * UUID Pattern: 66666666-6666-6666-8666-6666666600XX
 */
export const PROGRAMME_TEMPLATE_IDS = {
  [LEVEL_PROGRAMME_SLUGS[1]]: '66666666-6666-6666-8666-666666660001',
  [LEVEL_PROGRAMME_SLUGS[2]]: '66666666-6666-6666-8666-666666660002',
  [LEVEL_PROGRAMME_SLUGS[3]]: '66666666-6666-6666-8666-666666660003',
} as const;

export type ProgrammeTemplateSlug = keyof typeof PROGRAMME_TEMPLATE_IDS;

/** One shell per level; each carries the minimum hierarchy to generate a programme */
export const DEFAULT_PROGRAMME_TEMPLATES: NewProgrammeTemplate[] = [
  {
    id: PROGRAMME_TEMPLATE_IDS[LEVEL_PROGRAMME_SLUGS[1]],
    slug: LEVEL_PROGRAMME_SLUGS[1],
    name: 'Level 1: Gentle Mobility',
    description: 'Gentle mobility and stretching, ideal for easing desk tension.',
    isActive: true,
    totalPhases: 4,
    difficulty: 'beginner',
  },
  {
    id: PROGRAMME_TEMPLATE_IDS[LEVEL_PROGRAMME_SLUGS[2]],
    slug: LEVEL_PROGRAMME_SLUGS[2],
    name: 'Level 2: Active Wellness',
    description: 'Baseline movement and functional training at a moderate pace.',
    isActive: true,
    totalPhases: 1,
    difficulty: 'intermediate',
  },
  {
    id: PROGRAMME_TEMPLATE_IDS[LEVEL_PROGRAMME_SLUGS[3]],
    slug: LEVEL_PROGRAMME_SLUGS[3],
    name: 'Level 3: Energised & Dynamic',
    description: 'Higher-intensity bodyweight work for those who are already active.',
    isActive: true,
    totalPhases: 1,
    difficulty: 'advanced',
  },
];

/**
 * Seeds the given programme templates. IDEMPOTENT: an existing template, matched by ID, is left
 * as it is. The programme_templates table has no RLS.
 *
 * @returns The IDs of the templates created
 */
export const seedProgrammeTemplates = async (
  db: NodePgDatabase<typeof schema>,
  templates: NewProgrammeTemplate[]
): Promise<string[]> => {
  logger.info('Seeding programme templates...');

  const created: string[] = [];

  for (const template of templates) {
    const templateId = requireSeedId(template, `programme template "${template.slug}"`);
    const existingTemplate = await db.query.programmeTemplates.findFirst({
      where: eq(programmeTemplates.id, templateId),
    });

    if (existingTemplate) {
      logger.warn(`Programme template already exists: "${template.slug}"`);
      continue;
    }

    await db.insert(programmeTemplates).values(template);

    logger.info('Programme template created', { slug: template.slug, id: templateId });
    created.push(templateId);
  }

  logger.info('Programme templates seed complete', {
    created: created.length,
    alreadyExisted: templates.length - created.length,
  });

  return created;
};
