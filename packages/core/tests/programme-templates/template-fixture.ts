import { eq } from 'drizzle-orm';

import {
  programmeTemplates,
  templatePhases,
  templateSessions,
  type ProgrammeTemplateRecord,
  type TemplateSessionRecord,
} from '@ffp/database/schema';

import { type TestTx } from '../lib/rolled-back-transaction.fixture';
import { shortId } from '../tags/tag-fixture';

export interface TemplateFixture {
  template: ProgrammeTemplateRecord;
  phaseId: string;
  session: TemplateSessionRecord;
}

/** A throwaway template with one phase holding one session */
export async function insertTemplateWithSession(tx: TestTx): Promise<TemplateFixture> {
  const [template] = await tx
    .insert(programmeTemplates)
    .values({ slug: `slot-test-${shortId()}`, name: 'Slot test template', totalPhases: 1 })
    .returning();
  const [phase] = await tx
    .insert(templatePhases)
    .values({ programmeTemplateId: template.id, phaseNumber: 1, sessionCount: 1 })
    .returning();
  const [session] = await tx
    .insert(templateSessions)
    .values({ templatePhaseId: phase.id, sessionNumber: 1 })
    .returning();

  return { template, phaseId: phase.id, session };
}

export async function readTemplate(
  tx: TestTx,
  templateId: string
): Promise<ProgrammeTemplateRecord> {
  const [template] = await tx
    .select()
    .from(programmeTemplates)
    .where(eq(programmeTemplates.id, templateId));

  return template;
}
