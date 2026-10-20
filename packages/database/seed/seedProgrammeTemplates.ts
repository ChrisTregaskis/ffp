import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { programmeTemplates } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import { LEVEL_PROGRAMME_SLUGS } from '../src/constants/level-scoring.constants.js';

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
const DEFAULT_PROGRAMME_TEMPLATES: NewProgrammeTemplate[] = [
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
 * Seeds programme templates for MVP.
 *
 * This seed is IDEMPOTENT - safe to run multiple times.
 * Templates are checked by ID before inserting (existing templates are skipped).
 *
 * Note: programme_templates table has NO RLS (system-managed lookup table),
 * so no special context needed.
 *
 * @param db - Database client with schema
 * @returns Promise<number> - Number of templates created (0 if all existed)
 */
export const seedProgrammeTemplates = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<number> => {
  logger.info('Seeding programme templates...');

  let createdCount = 0;

  for (const template of DEFAULT_PROGRAMME_TEMPLATES) {
    // Check if template already exists (idempotency check by ID)
    const existingTemplate = await db.query.programmeTemplates.findFirst({
      where: eq(programmeTemplates.id, template.id!),
    });

    if (existingTemplate) {
      logger.warn(`Programme template already exists: "${template.slug}"`);
      continue;
    }

    // Insert new template
    const [newTemplate] = await db.insert(programmeTemplates).values(template).returning({
      id: programmeTemplates.id,
      slug: programmeTemplates.slug,
      name: programmeTemplates.name,
    });

    logger.info('Programme template created', {
      slug: newTemplate.slug,
      id: newTemplate.id,
      name: newTemplate.name,
    });

    createdCount++;
  }

  logger.info('Programme templates seed complete', {
    created: createdCount,
    alreadyExisted: DEFAULT_PROGRAMME_TEMPLATES.length - createdCount,
  });

  return createdCount;
};
