/**
 * Connection Pool Tests
 *
 * Tests for database client singleton behaviour and connection pooling.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { getDb, closeDb } from './client';

describe('Database Client', () => {
  afterAll(async () => {
    await closeDb();
  });

  it('should return singleton instance', () => {
    const db1 = getDb();
    const db2 = getDb();

    expect(db1).toBe(db2);
  });

  it('should have correct type', () => {
    const db = getDb();

    // Verify it has the expected Drizzle methods
    expect(db).toHaveProperty('select');
    expect(db).toHaveProperty('insert');
    expect(db).toHaveProperty('update');
    expect(db).toHaveProperty('delete');
  });

  it('should reset instance after closeDb', async () => {
    const db1 = getDb();
    await closeDb();
    const db2 = getDb();

    // After closing, we should get a new instance
    expect(db1).not.toBe(db2);
  });
});
