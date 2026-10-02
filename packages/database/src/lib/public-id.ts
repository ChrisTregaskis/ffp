import { varchar, uniqueIndex } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

import { PUBLIC_ID_LENGTH } from '../constants/public-id.constants';

import type { IndexColumn } from 'drizzle-orm/pg-core';

/**
 * Generate a new public ID.
 *
 * Call this when inserting new rows into tables with a `public_id` column.
 */
export const generatePublicId = (): string => nanoid(PUBLIC_ID_LENGTH);

/**
 * Drizzle column definition for `public_id`.
 *
 * Use this in any table that appears in URL routes. The column is:
 * - NOT NULL with a default generated on insert via `$defaultFn`
 * - VARCHAR(12) — compact, URL-safe
 * - Must be paired with a unique index (see `publicIdIndex`)
 *
 * @example
 * ```ts
 * export const myTable = pgTable('my_table', {
 *   id: uuid('id').primaryKey().defaultRandom(),
 *   publicId: publicIdColumn(),
 *   // ...other columns
 * }, (table) => [
 *   publicIdIndex('my_table', table.publicId),
 * ]);
 * ```
 */
export const publicIdColumn = () =>
  varchar('public_id', { length: PUBLIC_ID_LENGTH })
    .notNull()
    .$defaultFn(() => generatePublicId());

/**
 * Unique index for `public_id` column.
 *
 * Follows the project convention: `idx_{tableName}_public_id`.
 */
export const publicIdIndex = (tableName: string, column: IndexColumn) =>
  uniqueIndex(`idx_${tableName}_public_id`).on(column);
