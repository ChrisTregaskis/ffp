import { and, eq, or, ilike, inArray, count, type SQL, type Column } from 'drizzle-orm';

import type { DbQueryClient } from '@ffp/database';
import {
  programmeTemplates,
  type ProgrammeTemplateRecord,
  type NewProgrammeTemplate,
} from '@ffp/database/schema';
import { templatePhases, templateSessions, sessionExercises } from '@ffp/database/schema';

import { applyPagination } from '../lib/pagination';

import type { PaginationInput } from '../schemas/pagination.schema';
import type {
  UpdateProgrammeTemplateInput,
  TemplateListQuery,
} from '../schemas/programme/programme.schema';
import type { TemplatePhaseWithSessions } from '../schemas/programme-structure.schema';

/** Internal update type — extends the API input with fields managed by the system (e.g., totalPhases) */
type TemplateUpdateData = UpdateProgrammeTemplateInput & { totalPhases?: number };

/** Columns available for sorting on the admin template list */
const SORTABLE_COLUMNS: Partial<Record<string, Column>> = {
  name: programmeTemplates.name,
  slug: programmeTemplates.slug,
  difficulty: programmeTemplates.difficulty,
  totalPhases: programmeTemplates.totalPhases,
  isActive: programmeTemplates.isActive,
  createdAt: programmeTemplates.createdAt,
  updatedAt: programmeTemplates.updatedAt,
};

/** Build WHERE conditions from template list query filters. */
const buildFilterConditions = (filters: Omit<TemplateListQuery, keyof PaginationInput>): SQL[] => {
  const conditions: SQL[] = [];

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    const searchCondition = or(
      ilike(programmeTemplates.name, pattern),
      ilike(programmeTemplates.slug, pattern)
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (filters.difficulty) {
    conditions.push(eq(programmeTemplates.difficulty, filters.difficulty));
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(programmeTemplates.isActive, filters.isActive));
  }

  return conditions;
};

/** Returns paginated programme templates with optional filters. */
export async function findAllTemplates(
  db: DbQueryClient,
  paginationInput: PaginationInput,
  filters: Omit<TemplateListQuery, keyof PaginationInput>
): Promise<ProgrammeTemplateRecord[]> {
  const conditions = buildFilterConditions(filters);

  const query = db
    .select()
    .from(programmeTemplates)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .$dynamic();

  return await applyPagination(query, paginationInput, SORTABLE_COLUMNS);
}

/** Returns total count of templates matching the given filters. */
export async function countAllTemplates(
  db: DbQueryClient,
  filters: Omit<TemplateListQuery, keyof PaginationInput>
): Promise<number> {
  const conditions = buildFilterConditions(filters);

  const result = await db
    .select({ count: count() })
    .from(programmeTemplates)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result[0].count;
}

/** Returns a single template by ID, or null if not found. */
export async function findTemplateById(
  db: DbQueryClient,
  templateId: string
): Promise<ProgrammeTemplateRecord | null> {
  const records = await db
    .select()
    .from(programmeTemplates)
    .where(eq(programmeTemplates.id, templateId))
    .limit(1);

  return records[0] ?? null;
}

/** Returns a single template by public ID, or null if not found. */
export async function findTemplateByPublicId(
  db: DbQueryClient,
  publicId: string
): Promise<ProgrammeTemplateRecord | null> {
  const records = await db
    .select()
    .from(programmeTemplates)
    .where(eq(programmeTemplates.publicId, publicId))
    .limit(1);

  return records[0] ?? null;
}

/** Returns a single template by slug, or null if not found. */
export async function findTemplateBySlug(
  db: DbQueryClient,
  slug: string
): Promise<ProgrammeTemplateRecord | null> {
  const records = await db
    .select()
    .from(programmeTemplates)
    .where(eq(programmeTemplates.slug, slug))
    .limit(1);

  return records[0] ?? null;
}

/**
 * Returns the full nested hierarchy for a template:
 * phases → sessions → exercises (ordered by position).
 */
export async function findTemplateHierarchy(
  db: DbQueryClient,
  templateId: string
): Promise<{ phases: TemplatePhaseWithSessions[] }> {
  // Fetch all hierarchy levels in parallel — independent queries, no shared transaction
  const [phaseRows, sessionRows, exerciseRows] = await Promise.all([
    db
      .select()
      .from(templatePhases)
      .where(eq(templatePhases.programmeTemplateId, templateId))
      .orderBy(templatePhases.phaseNumber),
    db
      .select()
      .from(templateSessions)
      .where(
        inArray(
          templateSessions.templatePhaseId,
          db
            .select({ id: templatePhases.id })
            .from(templatePhases)
            .where(eq(templatePhases.programmeTemplateId, templateId))
        )
      )
      .orderBy(templateSessions.sessionNumber),
    db
      .select()
      .from(sessionExercises)
      .where(
        inArray(
          sessionExercises.templateSessionId,
          db
            .select({ id: templateSessions.id })
            .from(templateSessions)
            .where(
              inArray(
                templateSessions.templatePhaseId,
                db
                  .select({ id: templatePhases.id })
                  .from(templatePhases)
                  .where(eq(templatePhases.programmeTemplateId, templateId))
              )
            )
        )
      )
      .orderBy(sessionExercises.orderIndex),
  ]);

  // Build exercise lookup: sessionId → exercises[]
  const exercisesBySession = new Map<string, typeof exerciseRows>();
  for (const exercise of exerciseRows) {
    const existing = exercisesBySession.get(exercise.templateSessionId) ?? [];
    existing.push(exercise);
    exercisesBySession.set(exercise.templateSessionId, existing);
  }

  // Build session lookup: phaseId → sessions[]
  const sessionsByPhase = new Map<string, typeof sessionRows>();
  for (const session of sessionRows) {
    const existing = sessionsByPhase.get(session.templatePhaseId) ?? [];
    existing.push(session);
    sessionsByPhase.set(session.templatePhaseId, existing);
  }

  // Assemble the hierarchy
  return {
    phases: phaseRows.map((phase) => ({
      id: phase.id,
      publicId: phase.publicId,
      phaseNumber: phase.phaseNumber,
      name: phase.name,
      description: phase.description,
      sessionCount: phase.sessionCount,
      sessions: (sessionsByPhase.get(phase.id) ?? []).map((session) => ({
        id: session.id,
        sessionNumber: session.sessionNumber,
        name: session.name,
        estimatedDurationMinutes: session.estimatedDurationMinutes,
        exercises: (exercisesBySession.get(session.id) ?? []).map((exercise) => ({
          id: exercise.id,
          videoId: exercise.videoId,
          orderIndex: exercise.orderIndex,
          sets: exercise.sets,
          reps: exercise.reps,
          durationSeconds: exercise.durationSeconds,
          restSeconds: exercise.restSeconds,
          notes: exercise.notes,
        })),
      })),
    })),
  };
}

/** Inserts a new programme template and returns the created record. */
export async function insertTemplate(
  db: DbQueryClient,
  input: NewProgrammeTemplate
): Promise<ProgrammeTemplateRecord> {
  const records = await db.insert(programmeTemplates).values(input).returning();

  return records[0];
}

/** Updates a programme template and returns the updated record, or null if not found. */
export async function updateTemplate(
  db: DbQueryClient,
  templateId: string,
  data: TemplateUpdateData
): Promise<ProgrammeTemplateRecord | null> {
  const records = await db
    .update(programmeTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(programmeTemplates.id, templateId))
    .returning();

  return records[0] ?? null;
}

/** Sets isActive to false for a template. Returns the updated record, or null if not found. */
export async function deactivateTemplate(
  db: DbQueryClient,
  templateId: string
): Promise<ProgrammeTemplateRecord | null> {
  const records = await db
    .update(programmeTemplates)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(programmeTemplates.id, templateId))
    .returning();

  return records[0] ?? null;
}
