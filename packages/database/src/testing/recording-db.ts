import { PgDialect } from 'drizzle-orm/pg-core';

import type { SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface RecordedStatement {
  text: string;
  params: unknown[];
}

/**
 * A stand-in for a database connection that records each statement as Postgres would receive
 * it (whitespace collapsed), for code that issues DDL or grants a test role may not run.
 * `respond` supplies the rows a statement returns; a throw from it fails that statement.
 */
export const recordingDb = (
  respond: (statement: RecordedStatement) => Record<string, unknown>[] = () => []
): { db: NodePgDatabase; statements: RecordedStatement[] } => {
  const dialect = new PgDialect();
  const statements: RecordedStatement[] = [];

  const execute = (query: SQL): Promise<{ rows: Record<string, unknown>[] }> => {
    const { sql: text, params } = dialect.sqlToQuery(query);
    const statement = { text: text.replace(/\s+/g, ' ').trim(), params };

    statements.push(statement);

    try {
      return Promise.resolve({ rows: respond(statement) });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const db = {
    execute,
    transaction: async <T>(run: (tx: { execute: typeof execute }) => Promise<T>): Promise<T> =>
      run({ execute }),
  };

  // Only `execute` and `transaction` are used by the migration steps under test
  return { db: db as unknown as NodePgDatabase, statements };
};
