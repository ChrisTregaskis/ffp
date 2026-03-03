import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { programmeTemplates } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';

import type { NewProgrammeTemplate } from '../src/schema/programme-templates.js';

const logger = createLogger('seed-programme-templates');

/**
 * Deterministic UUIDs for programme templates
 *
 * These are fixed to ensure consistency across seed runs and allow
 * scoring config programmeMappings to reference them reliably by slug.
 *
 * UUID Pattern: 66666666-6666-6666-8666-6666666600XX
 * - gentle-mobility-programme: 01
 * - foundation-programme: 02
 * - advanced-strength-programme: 03
 * - general-wellness-programme: 04
 */
export const PROGRAMME_TEMPLATE_IDS = {
  'gentle-mobility-programme': '66666666-6666-6666-8666-666666660001',
  'foundation-programme': '66666666-6666-6666-8666-666666660002',
  'advanced-strength-programme': '66666666-6666-6666-8666-666666660003',
  'general-wellness-programme': '66666666-6666-6666-8666-666666660004',
} as const;

export type ProgrammeTemplateSlug = keyof typeof PROGRAMME_TEMPLATE_IDS;

/**
 * Programme template definitions matching scoring config in seedAssessmentFlows.ts
 *
 * These templates are referenced by slug in the flow's programmeMappings:
 * - priority 1 & 2 (pain >= 35 / >= 20): gentle-mobility-programme
 * - priority 3 (low strength + low balance): foundation-programme
 * - priority 4 (low pain + high strength): advanced-strength-programme
 * - priority 10 (default fallback): general-wellness-programme
 */
const DEFAULT_PROGRAMME_TEMPLATES: NewProgrammeTemplate[] = [
  {
    id: PROGRAMME_TEMPLATE_IDS['gentle-mobility-programme'],
    slug: 'gentle-mobility-programme',
    name: 'Gentle Mobility Programme',
    description:
      'Low-impact mobility and flexibility exercises for users with significant pain or red flags. ' +
      'Focuses on gentle range-of-motion work and pain management techniques.',
    isActive: true,
    totalPhases: 4,
    sessionsPerPhase: 3,
    difficulty: 'beginner',
  },
  {
    id: PROGRAMME_TEMPLATE_IDS['foundation-programme'],
    slug: 'foundation-programme',
    name: 'Foundation Programme',
    description:
      'Foundational strength and balance exercises for users with low baseline fitness. ' +
      'Builds core stability and basic movement patterns before progressing.',
    isActive: true,
    totalPhases: 6,
    sessionsPerPhase: 3,
    difficulty: 'beginner',
  },
  {
    id: PROGRAMME_TEMPLATE_IDS['advanced-strength-programme'],
    slug: 'advanced-strength-programme',
    name: 'Advanced Strength Programme',
    description:
      'Progressive strength training for users with good baseline and low pain. ' +
      'Includes compound movements and progressive overload principles.',
    isActive: true,
    totalPhases: 8,
    sessionsPerPhase: 4,
    difficulty: 'advanced',
  },
  {
    id: PROGRAMME_TEMPLATE_IDS['general-wellness-programme'],
    slug: 'general-wellness-programme',
    name: 'General Wellness Programme',
    description:
      'Balanced general fitness programme covering strength, mobility, and balance. ' +
      'Default recommendation when no specific programme mapping matches.',
    isActive: true,
    totalPhases: 6,
    sessionsPerPhase: 3,
    difficulty: 'intermediate',
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
